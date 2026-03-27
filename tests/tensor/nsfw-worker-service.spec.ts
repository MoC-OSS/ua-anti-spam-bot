// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Imports (after mocks are hoisted)
// ---------------------------------------------------------------------------

import { NsfwWorkerService } from '@tensor/nsfw-worker-service';

import type { NsfwPredictor, NsfwTensorResult } from '@app-types/nsfw';

const { mockWorker } = vi.hoisted(() => {
  /** Minimal event listener registry (avoids EventEmitter/EventTarget dependency). */
  type EventCallback = (...callbackArguments: unknown[]) => void;
  const registry = new Map<string, EventCallback[]>();

  const fakeWorker = {
    postMessage: vi.fn(),
    terminate: vi.fn().mockResolvedValue(0),
    on(event: string, handler: EventCallback) {
      const current = registry.get(event) ?? [];

      registry.set(event, [...current, handler]);

      return fakeWorker;
    },
    once(event: string, handler: EventCallback) {
      const wrapped = (...callbackArguments: unknown[]) => {
        handler(...callbackArguments);

        registry.set(
          event,
          (registry.get(event) ?? []).filter((registered) => registered !== wrapped),
        );
      };

      registry.set(event, [...(registry.get(event) ?? []), wrapped]);

      return fakeWorker;
    },
    removeAllListeners() {
      registry.clear();

      return fakeWorker;
    },
    emit(event: string, ...callbackArguments: unknown[]) {
      for (const handler of registry.get(event) ?? []) {
        handler(...callbackArguments);
      }

      return true;
    },
  };

  return { mockWorker: fakeWorker };
});

vi.mock('node:worker_threads', () => {
  // eslint-disable-next-line func-names
  const workerMock = vi.fn(function () {
    return mockWorker;
  });

  return { Worker: workerMock };
});

vi.mock('@shared/config', () => ({
  environmentConfig: {
    ENV: 'production',
    UNIT_TESTING: false,
  },
}));

vi.mock('@utils/logger.util', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Schedules a 'ready' message from the fake worker on the next event-loop tick. */
const emitReady = () => setImmediate(() => mockWorker.emit('message', { type: 'ready' }));

const negativeResult: NsfwTensorResult = {
  isSpam: false,
  predictions: [],
  highestPrediction: { className: 'Neutral', probability: 0.9 },
};

const positiveResult: NsfwTensorResult = {
  isSpam: true,
  predictions: [],
  deletePrediction: { className: 'Porn', probability: 0.95 },
  deleteRank: 0.95,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NsfwWorkerService', () => {
  beforeEach(() => {
    mockWorker.removeAllListeners();
    mockWorker.postMessage.mockClear();
    mockWorker.terminate.mockClear();
  });

  describe('create()', () => {
    describe('positive cases', () => {
      it('resolves when the worker emits ready', async () => {
        emitReady();
        const service = await NsfwWorkerService.create();

        expect(service).toBeInstanceOf(NsfwWorkerService);
      });

      it('passes InceptionV3 modelType for non-local ENV', async () => {
        emitReady();
        await NsfwWorkerService.create();

        const { Worker } = await import('node:worker_threads');

        expect(vi.mocked(Worker)).toHaveBeenCalledWith(
          expect.stringContaining('nsfw-worker'),
          expect.objectContaining({ workerData: { modelType: 'InceptionV3' } }),
        );
      });

      it('forwards process.execArgv to the worker', async () => {
        emitReady();
        await NsfwWorkerService.create();

        const { Worker } = await import('node:worker_threads');

        expect(vi.mocked(Worker)).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ execArgv: expect.any(Array) }));
      });
    });

    describe('negative cases', () => {
      it('rejects when the worker emits init-error', async () => {
        setImmediate(() => mockWorker.emit('message', { type: 'init-error', error: 'model not found' }));

        await expect(NsfwWorkerService.create()).rejects.toThrow('model not found');
      });

      it('rejects when the worker emits an error event', async () => {
        const workerError = new Error('worker spawn failed');

        setImmediate(() => mockWorker.emit('error', workerError));

        await expect(NsfwWorkerService.create()).rejects.toThrow('worker spawn failed');
      });
    });
  });

  describe('predictVideo()', () => {
    let service: NsfwWorkerService;

    beforeEach(async () => {
      emitReady();
      service = await NsfwWorkerService.create();
    });

    describe('positive cases', () => {
      it('resolves with the result from the worker', async () => {
        const buffers = [Buffer.from('frame1'), Buffer.from('frame2')];
        const predictionPromise = service.predictVideo(buffers);

        const { id } = mockWorker.postMessage.mock.calls[0][0] as { id: string };

        mockWorker.emit('message', { type: 'result', id, result: negativeResult });

        await expect(predictionPromise).resolves.toEqual(negativeResult);
      });

      it('transfers image buffers as ArrayBuffers to the worker', async () => {
        const buffers = [Buffer.from('frame1')];
        const predictionPromise = service.predictVideo(buffers);

        const { id } = mockWorker.postMessage.mock.calls[0][0] as { id: string };

        mockWorker.emit('message', { type: 'result', id, result: negativeResult });
        await predictionPromise;

        const [message, transferList] = mockWorker.postMessage.mock.calls[0];

        expect((message as { buffers: ArrayBuffer[] }).buffers[0]).toBeInstanceOf(ArrayBuffer);
        expect(transferList).toBeInstanceOf(Array);
        expect((transferList as ArrayBuffer[])[0]).toBeInstanceOf(ArrayBuffer);
      });

      it('resolves with a positive spam result', async () => {
        const buffers = [Buffer.from('nsfw-frame')];
        const predictionPromise = service.predictVideo(buffers);

        const { id } = mockWorker.postMessage.mock.calls[0][0] as { id: string };

        mockWorker.emit('message', { type: 'result', id, result: positiveResult });

        await expect(predictionPromise).resolves.toEqual(positiveResult);
      });

      it('uses unique request IDs for concurrent requests and matches responses correctly', async () => {
        const buffers = [Buffer.from('f')];
        const p1 = service.predictVideo(buffers);
        const p2 = service.predictVideo(buffers);

        const id1 = (mockWorker.postMessage.mock.calls[0][0] as { id: string }).id;
        const id2 = (mockWorker.postMessage.mock.calls[1][0] as { id: string }).id;

        expect(id1).not.toEqual(id2);

        // Resolve out of order.
        mockWorker.emit('message', { type: 'result', id: id2, result: positiveResult });
        mockWorker.emit('message', { type: 'result', id: id1, result: negativeResult });

        await expect(p1).resolves.toEqual(negativeResult);
        await expect(p2).resolves.toEqual(positiveResult);
      });
    });

    describe('negative cases', () => {
      it('rejects when the worker responds with an error', async () => {
        const buffers = [Buffer.from('bad-frame')];
        const predictionPromise = service.predictVideo(buffers);

        const { id } = mockWorker.postMessage.mock.calls[0][0] as { id: string };

        mockWorker.emit('message', { type: 'error', id, error: 'decode failed' });

        await expect(predictionPromise).rejects.toThrow('decode failed');
      });

      it('rejects all pending requests when the worker crashes', async () => {
        const p1 = service.predictVideo([Buffer.from('a')]);
        const p2 = service.predictVideo([Buffer.from('b')]);

        mockWorker.emit('error', new Error('unexpected crash'));

        await expect(p1).rejects.toThrow('Worker crashed');
        await expect(p2).rejects.toThrow('Worker crashed');
      });
    });
  });

  describe('terminate()', () => {
    it('calls worker.terminate()', async () => {
      emitReady();
      const service = await NsfwWorkerService.create();

      await service.terminate();

      expect(mockWorker.terminate).toHaveBeenCalledOnce();
    });
  });
});

describe('initNsfwWorker()', () => {
  describe('positive cases', () => {
    it('returns a stub NsfwPredictor in UNIT_TESTING mode', async () => {
      const { environmentConfig } = await import('@shared/config');

      Object.assign(environmentConfig, { UNIT_TESTING: true });

      const { initNsfwWorker } = await import('@tensor/nsfw-worker-service');
      const predictor: NsfwPredictor = await initNsfwWorker();

      expect(predictor).toBeDefined();
      expect(typeof predictor.predictVideo).toBe('function');

      const result = await predictor.predictVideo([]);

      expect(result.isSpam).toBe(false);

      Object.assign(environmentConfig, { UNIT_TESTING: false });
    });
  });
});
