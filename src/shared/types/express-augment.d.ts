/**
 * Module augmentation for Node's `http.IncomingMessage`.
 * Adds `rawBody` populated by the `express.json({ verify })` callback in server/index.ts.
 *
 * Augmenting `IncomingMessage` (rather than the Express `Request` overlay) is necessary
 * because the `express.json` `verify` callback receives a plain `IncomingMessage`, while
 * Express route handlers receive the augmented `Request` which extends `IncomingMessage`.
 * Augmenting at the base type makes `rawBody` available in both contexts.
 */
declare module 'http' {
  interface IncomingMessage {
    /** Raw UTF-8 request body captured before JSON parsing. Set only when Content-Type is application/json. */
    rawBody?: string;
  }
}
