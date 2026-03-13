/**
 * Jest global setup file.
 * Polyfills deprecated Node.js `util` methods removed in Node 24 that are
 * still referenced by older native addons such as @tensorflow/tfjs-node.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, unicorn/prefer-module, global-require
const util = require('node:util') as Record<string, unknown>;

if (typeof util['isNullOrUndefined'] !== 'function') {
  util['isNullOrUndefined'] = (value: unknown): value is null | undefined => value === null || value === undefined;
}
