/**
 * Benchmark: parallel (Promise.all) vs sequential (early-stop) frame classification
 *
 * Two scenarios are tested to understand what actually limits throughput:
 *
 * 1. I/O-bound  (setTimeout delay)  — represents the best case for Promise.all;
 *    async work truly overlaps so all frames finish in ~one slot instead of N slots.
 *
 * 2. CPU-bound  (busy-wait delay)   — represents TF.js Node.js inference, which
 *    runs blocking C++ ops in the JS thread.  Promise.all cannot overlap CPU work
 *    on a single thread, so it adds no benefit over sequential.
 *
 * Three frame sets are tested for each:
 *   - All safe       → sequential always checks every frame (worst case for sequential)
 *   - NSFW at start  → sequential stops at frame 1     (best case for sequential)
 *   - NSFW at end    → sequential stops at frame N-1   (near-worst case for sequential)
 */

const FRAME_DELAY_MS = 30; // simulated inference time per frame
const RUNS = 6; // warm-up + measured runs
const WARM_UP = 2;

// ---------------------------------------------------------------------------
// Fake "classify" implementations
// ---------------------------------------------------------------------------

const NSFW_PREDICTION = [{ className: 'Porn', probability: 0.95 }];
const SAFE_PREDICTION = [{ className: 'Neutral', probability: 0.99 }];

function ioBoundClassify(isNsfw: boolean): Promise<typeof NSFW_PREDICTION> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(isNsfw ? NSFW_PREDICTION : SAFE_PREDICTION), FRAME_DELAY_MS);
  });
}

function cpuBoundClassify(isNsfw: boolean): Promise<typeof NSFW_PREDICTION> {
  return new Promise((resolve) => {
    // Busy-wait — blocks the event loop exactly like synchronous C++ TF ops do
    const end = Date.now() + FRAME_DELAY_MS;

    while (Date.now() < end) {
      /* spin */
    }

    resolve(isNsfw ? NSFW_PREDICTION : SAFE_PREDICTION);
  });
}

// ---------------------------------------------------------------------------
// The two strategies under test
// ---------------------------------------------------------------------------

type ClassifyFn = (isNsfw: boolean) => Promise<{ className: string; probability: number }[]>;

function isNsfwFrame(predictions: { className: string; probability: number }[]): boolean {
  return predictions.some((p) => p.className !== 'Neutral' && p.probability > 0.85);
}

async function parallelStrategy(frames: boolean[], classify: ClassifyFn) {
  const results = await Promise.all(frames.map((isNsfw) => classify(isNsfw)));

  // aggregation-only early stop (original behaviour)
  let checkedCount = 0;

  for (const predictions of results) {
    checkedCount++;

    if (isNsfwFrame(predictions)) {
      break;
    }
  }

  return { checkedCount, framesClassified: results.length };
}

async function sequentialStrategy(frames: boolean[], classify: ClassifyFn) {
  const results: Awaited<ReturnType<ClassifyFn>>[] = [];

  for (const isNsfw of frames) {
    const predictions = await classify(isNsfw);

    results.push(predictions);

    if (isNsfwFrame(predictions)) {
      break;
    }
  }

  return { checkedCount: results.length, framesClassified: results.length };
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function measure(label: string, fn: () => Promise<{ checkedCount: number; framesClassified: number }>) {
  const times: number[] = [];
  let lastResult = { checkedCount: 0, framesClassified: 0 };

  for (let run = 0; run < RUNS; run++) {
    const start = performance.now();

    lastResult = await fn();

    const elapsed = performance.now() - start;

    if (run >= WARM_UP) {
      times.push(elapsed);
    }
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  console.log(
    `  ${label.padEnd(46)} avg ${avg.toFixed(1).padStart(7)}ms  min ${min.toFixed(1).padStart(7)}ms  max ${max.toFixed(1).padStart(7)}ms  (frames actually classified: ${lastResult.framesClassified})`,
  );
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

const SCENARIOS: { label: string; frames: boolean[] }[] = [
  { label: 'all safe (10 frames)', frames: Array.from({ length: 10 }, () => false) },
  { label: 'NSFW at frame 1', frames: [true, ...Array.from({ length: 9 }, () => false)] },
  { label: 'NSFW at frame 5', frames: [...Array.from({ length: 4 }, () => false), true, ...Array.from({ length: 5 }, () => false)] },
  { label: 'NSFW at frame 10', frames: [...Array.from({ length: 9 }, () => false), true] },
];

async function runSection(title: string, classify: ClassifyFn) {
  console.log(`\n${'─'.repeat(90)}`);
  console.log(`  ${title}  (${FRAME_DELAY_MS}ms per frame, ${RUNS - WARM_UP} measured runs after ${WARM_UP} warm-up)`);
  console.log(`${'─'.repeat(90)}`);

  for (const { label, frames } of SCENARIOS) {
    await measure(`parallel  | ${label}`, () => parallelStrategy(frames, classify));
    await measure(`sequential| ${label}`, () => sequentialStrategy(frames, classify));
    console.log();
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  await runSection('I/O-BOUND classify  (truly async — best case for Promise.all)', ioBoundClassify);
  await runSection('CPU-BOUND classify  (blocking loop — realistic for TF.js Node)', cpuBoundClassify);

  console.log(`\n${'─'.repeat(90)}`);
  console.log('  INTERPRETATION');
  console.log(`${'─'.repeat(90)}`);
  console.log('  I/O-bound: Promise.all overlaps async work → parallel is faster for safe content.');
  console.log('  CPU-bound: single JS thread cannot overlap blocking ops → both strategies take the');
  console.log('             same wall-clock time for safe content; sequential wins on NSFW content');
  console.log('             because it skips remaining frames entirely.');
  console.log('  TF.js Node (@tensorflow/tfjs-node) uses blocking C++ calls → CPU-bound is the');
  console.log('             realistic model.  Sequential with early-stop is the correct choice.');
  console.log();
}

main();
