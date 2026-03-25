/**
 * @module nsfw-worker-service
 * @description Main-thread proxy for NSFW image classification that delegates all
 * inference work to a dedicated worker thread (see {@link module:nsfw-worker}).
 *
 * Running TF.js inference in a worker thread prevents the synchronous
 * {@link https://js.tensorflow.org/api_node/latest/#node.decodeImage tf.node.decodeImage}
 * call and subsequent tensor operations from blocking the main event loop, keeping
 * the bot responsive (health-check, Grammy updates) during NSFW checks.
 *
 * Usage
 * -----
 * ```typescript
 * const classifier = await NsfwWorkerService.create();
 * const result = await classifier.predictVideo(imageBuffers);
 * ```
 */

import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';

import { environmentConfig } from '@shared/config';

import type { NsfwPredictor, NsfwTensorResult } from '@app-types/nsfw';

import { logger } from '@utils/logger.util';

/** Shape of a pending inference request waiting for the worker to respond. */
interface PendingRequest {
  resolve: (result: NsfwTensorResult) => void;
  reject: (error: Error) => void;
}

/** Messages received from the worker thread. */
type WorkerOutgoingMessage =
  | { type: 'error'; id: string; error: string }
  | { type: 'init-error'; error: string }
  | { type: 'ready' }
  | { type: 'result'; id: string; result: NsfwTensorResult };

/**
 * Main-thread proxy that routes NSFW inference requests to a worker thread.
 * Implements {@link NsfwPredictor} so it is a drop-in replacement for {@link NsfwTensorService}.
 */
export class NsfwWorkerService implements NsfwPredictor {
  private readonly worker: Worker;

  private readonly pendingRequests = new Map<string, PendingRequest>();

  private requestCounter = 0;

  private constructor(worker: Worker) {
    this.worker = worker;

    worker.on('message', (message: WorkerOutgoingMessage) => {
      if (message.type === 'result') {
        const pending = this.pendingRequests.get(message.id);

        if (pending) {
          this.pendingRequests.delete(message.id);
          pending.resolve(message.result);
        }
      } else if (message.type === 'error') {
        const pending = this.pendingRequests.get(message.id);

        if (pending) {
          this.pendingRequests.delete(message.id);
          pending.reject(new Error(message.error));
        }
      }
    });

    worker.on('error', (error) => {
      logger.error({ err: error }, 'NSFW worker thread encountered an unhandled error');

      // Reject all outstanding requests so callers don't hang.
      for (const [id, pending] of this.pendingRequests) {
        pending.reject(new Error(`Worker crashed: ${error.message}`));
        this.pendingRequests.delete(id);
      }
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        logger.error(`NSFW worker thread exited with code ${code}`);
      }
    });
  }

  /**
   * Creates and initializes an {@link NsfwWorkerService}.
   * Resolves once the worker has finished loading the NSFW model.
   * @returns A ready-to-use NsfwWorkerService instance.
   */
  static async create(): Promise<NsfwWorkerService> {
    const modelType = environmentConfig.ENV === 'local' ? 'MobileNetV2' : 'InceptionV3';
    const workerPath = fileURLToPath(new URL('nsfw-worker.ts', import.meta.url));

    const worker = new Worker(workerPath, {
      workerData: { modelType },
      // Pass the parent's execArgv so tsx's TypeScript loader is inherited in the worker.
      execArgv: [...process.execArgv],
    });

    return new Promise((resolve, reject) => {
      const service = new NsfwWorkerService(worker);

      // The worker posts 'ready' once nsfw.load() completes.
      worker.once('message', (message: WorkerOutgoingMessage) => {
        if (message.type === 'ready') {
          logger.info('NSFW worker thread ready.');
          resolve(service);
        } else if (message.type === 'init-error') {
          reject(new Error(`NSFW worker failed to initialize: ${message.error}`));
        }
      });

      worker.once('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Classifies a set of image buffers in the worker thread and returns an aggregated verdict.
   * Stops early if any frame exceeds the spam threshold (delegated to the worker).
   * @param imageArray - One image buffer per video frame.
   * @returns Aggregated NSFW prediction result.
   */
  predictVideo(imageArray: Buffer[]): Promise<NsfwTensorResult> {
    const id = String(this.requestCounter);

    this.requestCounter += 1;

    // Extract underlying ArrayBuffers so they can be transferred without copying.
    const transfers: ArrayBuffer[] = imageArray.map((buffer) => {
      const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

      return ab instanceof ArrayBuffer ? ab : new ArrayBuffer(0);
    });

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      this.worker.postMessage({ type: 'predictVideo', id, buffers: transfers }, transfers);
    });
  }

  /** Terminates the worker thread. Call during application shutdown. */
  async terminate(): Promise<void> {
    await this.worker.terminate();
  }
}

/**
 * Creates and initializes an {@link NsfwWorkerService}.
 * Skips worker creation during unit tests.
 * @returns A fully initialized NsfwWorkerService, or a no-op stub in test mode.
 */
export const initNsfwWorker = async (): Promise<NsfwPredictor> => {
  if (environmentConfig.UNIT_TESTING) {
    // In unit tests the worker is never started; predictVideo is mocked at the test level.
    return {
      predictVideo: () => Promise.resolve({ isSpam: false, predictions: [], highestPrediction: undefined as never }),
    };
  }

  logger.info('Starting NSFW worker thread...');
  const start = Date.now();
  const service = await NsfwWorkerService.create();

  logger.info(`NSFW worker thread ready in ${((Date.now() - start) / 1000).toFixed(2)}s.`);

  return service;
};
