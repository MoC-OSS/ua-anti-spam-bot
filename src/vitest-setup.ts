/**
 * Vitest global setup file.
 * Polyfills deprecated Node.js `util` methods removed in Node 24 that are
 * still referenced by older native addons such as @tensorflow/tfjs-node.
 */

// eslint-disable-next-line global-require
const utility = require('node:util') as Record<string, unknown>;

if (typeof utility['isNullOrUndefined'] !== 'function') {
  utility['isNullOrUndefined'] = (value: unknown): value is null | undefined => value === null || value === undefined;
}
