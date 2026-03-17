/**
 * Vitest global setup file.
 * Loads .env variables before any modules initialize, then polyfills deprecated
 * Node.js `util` methods removed in Node 24 that are still referenced by older
 * native addons such as \@tensorflow/tfjs-node.
 */

// eslint-disable-next-line global-require
const { config: dotenvConfig } = require('typed-dotenv') as { config: () => unknown };
// eslint-disable-next-line global-require
const utility = require('node:util') as Record<string, unknown>;

dotenvConfig();

if (typeof utility['isNullOrUndefined'] !== 'function') {
  utility['isNullOrUndefined'] = (value: unknown): value is null | undefined => value === null || value === undefined;
}
