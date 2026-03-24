/**
 * @module nsfw-worker
 * @description Worker thread entry point for NSFW image classification.
 *
 * This module runs in a dedicated worker thread so that the synchronous
 * {@link https://js.tensorflow.org/api_node/latest/#node.decodeImage tf.node.decodeImage}
 * call and all subsequent tensor operations are kept off the main event loop.
 *
 * Protocol
 * --------
 * Outgoing (worker → parent):
 *   - `{ type: 'ready' }` — posted once the NSFW model has finished loading.
 *   - `{ type: 'result', id: string, result: NsfwTensorResult }` — response to a predict request.
 *   - `{ type: 'error', id: string, error: string }` — when a predict call throws.
 *
 * Incoming (parent → worker):
 *   - `{ type: 'predictVideo', id: string, buffers: ArrayBuffer[] }` — classify a set of image
 *     buffers (one per video frame). Buffers are received as transferable ArrayBuffers.
 */

// @tensorflow/tfjs-node must be imported so it registers the native TF backend.
// nsfwjs depends on @tensorflow/tfjs; having tfjs-node imported in the same
// module ensures the native backend is registered before any model inference.
import { parentPort, workerData } from 'node:worker_threads';

import * as nsfw from 'nsfwjs';

import * as tf from '@tensorflow/tfjs-node';

import type { NsfwTensorNegativeResult, NsfwTensorPositiveResult, NsfwTensorResult } from '@app-types/nsfw';

/** Shape of the data passed to this worker when it is created. */
interface NsfwWorkerData {
  /** The NSFW model variant to load: 'InceptionV3' for production, 'MobileNetV2' for local. */
  modelType: 'InceptionV3' | 'MobileNetV2';
}

/** Incoming message shape from the parent thread. */
interface PredictVideoMessage {
  type: 'predictVideo';
  /** Correlation ID used by the parent to match the response to its pending Promise. */
  id: string;
  /** Raw image data for each video frame (transferred as ArrayBuffers for zero-copy IPC). */
  buffers: ArrayBuffer[];
}

const { modelType } = workerData as NsfwWorkerData;

/** Spam probability thresholds per NSFW class (mirrors NsfwTensorService.predictionChecks). */
const PREDICTION_CHECKS = new Map([
  ['Hentai', 0.85],
  ['Porn', 0.85],
  ['Sexy', 0.8],
]);

/** Loaded NSFW model – available after the 'ready' message is posted. */
let nsfwModel: Awaited<ReturnType<typeof nsfw.load>>;

/**
 * Finds the highest spam prediction and the first prediction exceeding its class threshold.
 * Mirrors the private `findHighestPrediction` method of {@link NsfwTensorService}.
 * @param predictions - Array of NSFW prediction results to analyze.
 * @returns Object with the highest probability prediction and the first prediction over its spam threshold.
 */
function findHighestPrediction(predictions: nsfw.PredictionType[]) {
  let highestPrediction!: nsfw.PredictionType;
  let deletePrediction: nsfw.PredictionType | undefined;

  for (const currentPrediction of predictions) {
    const spamThreshold = PREDICTION_CHECKS.get(currentPrediction.className);

    if (spamThreshold !== undefined) {
      const isNoHighestYet = !highestPrediction;
      const isHigher = highestPrediction && currentPrediction.probability > highestPrediction.probability;

      if (isNoHighestYet || isHigher) {
        highestPrediction = currentPrediction;
      }

      if (!deletePrediction && currentPrediction.probability > spamThreshold) {
        deletePrediction = currentPrediction;
      }
    }
  }

  return { highestPrediction, deletePrediction };
}

/**
 * Classifies a single image buffer using the loaded NSFW model.
 * @param imageData - Raw image bytes.
 * @returns Array of class predictions.
 */
async function classifySingleFrame(imageData: ArrayBuffer): Promise<nsfw.PredictionType[]> {
  const buffer = Buffer.from(imageData);
  const tensor3d = tf.node.decodeImage(buffer, 3);

  // @ts-ignore — nsfwjs type mismatch with tfjs tensor type
  const predictions = await nsfwModel.classify(tensor3d);

  tensor3d.dispose();

  return predictions;
}

/**
 * Classifies video frames sequentially, stopping early on the first frame that
 * exceeds a spam threshold.
 * @param buffers - ArrayBuffers for each video frame.
 * @returns Aggregated {@link NsfwTensorResult}.
 */
async function predictVideo(buffers: ArrayBuffer[]): Promise<NsfwTensorResult> {
  const allPredictions: nsfw.PredictionType[][] = [];
  let highestPrediction!: nsfw.PredictionType;
  let deletePrediction: nsfw.PredictionType | undefined;

  for (const imageData of buffers) {
    // eslint-disable-next-line no-await-in-loop
    const framePredictions = await classifySingleFrame(imageData);

    allPredictions.push(framePredictions);

    const combined = highestPrediction ? [highestPrediction, ...framePredictions] : framePredictions;
    const result = findHighestPrediction(combined);

    highestPrediction = result.highestPrediction;
    deletePrediction = result.deletePrediction;

    if (deletePrediction) {
      break;
    }
  }

  if (!deletePrediction) {
    return {
      isSpam: false,
      predictions: allPredictions,
      highestPrediction,
    } as NsfwTensorNegativeResult;
  }

  return {
    isSpam: true,
    predictions: allPredictions,
    deletePrediction,
    deleteRank: PREDICTION_CHECKS.get(deletePrediction.className),
  } as NsfwTensorPositiveResult;
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

if (!parentPort) {
  throw new Error('nsfw-worker.ts must be run as a worker thread');
}

const port = parentPort;

port.on('message', (message: PredictVideoMessage) => {
  if (message.type !== 'predictVideo') {
    return;
  }

  const { id, buffers } = message;

  predictVideo(buffers)
    .then((result) => port.postMessage({ type: 'result', id, result }))
    .catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);

      port.postMessage({ type: 'error', id, error: errorMessage });
    });
});

// Load the NSFW model then signal readiness to the parent thread.
nsfw
  .load(modelType)
  .then((model) => {
    nsfwModel = model;
    port.postMessage({ type: 'ready' });
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);

    port.postMessage({ type: 'init-error', error: message });
    process.exit(1);
  });
