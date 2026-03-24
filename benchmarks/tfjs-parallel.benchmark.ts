/**
 * Benchmark: does @tensorflow/tfjs-node block the event loop during inference?
 *
 * Uses real TF.js tensor operations (large matrix multiplication) to simulate
 * the cost of a single model inference. Then compares Promise.all vs sequential
 * to see whether concurrent calls actually overlap or serialise.
 *
 * If TF.js blocks the JS thread (CPU-bound model):
 *   Promise.all(N ops) ≈ sequential(N ops)  — no speedup
 *
 * If TF.js offloads to worker threads (I/O-bound model):
 *   Promise.all(N ops) ≈ 1 op              — ~N× speedup
 */

import * as tf from '@tensorflow/tfjs-node';

const MATRIX_SIZE = 512; // large enough to take ~measurable time per call
const RUNS = 5;
const WARM_UP = 2;
const PARALLEL_COUNT = 4; // use 4 instead of 10 to keep total run time reasonable

// ---------------------------------------------------------------------------
// Simulate one "classify" call using real TF.js matrix multiplication
// ---------------------------------------------------------------------------

async function tfOperation(): Promise<void> {
  const a = tf.randomNormal([MATRIX_SIZE, MATRIX_SIZE]);
  const b = tf.randomNormal([MATRIX_SIZE, MATRIX_SIZE]);
  const result = tf.matMul(a, b);

  // dataSync() forces computation to complete before returning —
  // this is what tfjs-node does internally when reading tensor values
  result.dataSync();

  tf.dispose([a, b, result]);
}

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------

async function parallelStrategy(count: number): Promise<void> {
  await Promise.all(Array.from({ length: count }, () => tfOperation()));
}

async function sequentialStrategy(count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await tfOperation();
  }
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function measure(label: string, fn: () => Promise<void>): Promise<number> {
  const times: number[] = [];

  for (let run = 0; run < RUNS; run++) {
    const start = performance.now();

    await fn();

    const elapsed = performance.now() - start;

    if (run >= WARM_UP) {
      times.push(elapsed);
    }
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);

  console.log(`  ${label.padEnd(30)} avg ${avg.toFixed(1).padStart(7)}ms   min ${min.toFixed(1).padStart(7)}ms`);

  return avg;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\nWarming up TF.js runtime...');

  // Force TF.js to initialise its thread pool before measuring
  await parallelStrategy(3);
  await sequentialStrategy(3);

  console.log(`\n${'─'.repeat(65)}`);
  console.log(`  REAL TF.js ops — matMul(${MATRIX_SIZE}×${MATRIX_SIZE}), ${PARALLEL_COUNT} frames`);
  console.log(`  ${RUNS - WARM_UP} measured runs after ${WARM_UP} warm-up`);
  console.log(`${'─'.repeat(65)}`);

  const singleAvg = await measure('1 op (baseline)', () => tfOperation());

  console.log();

  const parallelAvg = await measure(`${PARALLEL_COUNT} ops — Promise.all`, () => parallelStrategy(PARALLEL_COUNT));
  const sequentialAvg = await measure(`${PARALLEL_COUNT} ops — sequential`, () => sequentialStrategy(PARALLEL_COUNT));

  const speedupRatio = sequentialAvg / parallelAvg;
  const theoreticalSpeedup = PARALLEL_COUNT;

  console.log(`\n${'─'.repeat(65)}`);
  console.log('  RESULTS');
  console.log(`${'─'.repeat(65)}`);
  console.log(`  single op:          ${singleAvg.toFixed(1)}ms`);
  console.log(`  parallel speedup:   ${speedupRatio.toFixed(2)}× (theoretical max: ${theoreticalSpeedup}×)`);
  console.log();

  if (speedupRatio > 1.5) {
    console.log('  → TF.js releases the event loop between ops (I/O-bound model).');
    console.log('    Promise.all gives real concurrency. For safe content, parallel');
    console.log('    is faster; revert classifyVideo to Promise.all.');
  } else {
    console.log('  → TF.js blocks the JS thread (CPU-bound model).');
    console.log('    Promise.all adds no speedup for safe content.');
    console.log('    Sequential with early-stop is strictly better.');
  }

  console.log();
}

main().catch(console.error);
