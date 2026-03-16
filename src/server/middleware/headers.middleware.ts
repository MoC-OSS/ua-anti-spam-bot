import type { NextFunction, Request, Response } from 'express';

/**
 * Express middleware that sets permissive CORS headers on all responses.
 * @param request - The incoming Express request object.
 * @param response - The outgoing Express response object.
 * @param next - The next middleware function in the chain.
 * @returns The result of calling next().
 */
export const headersMiddleware = (request: Request, response: Response, next: NextFunction) => {
  response.header('Access-Control-Allow-Origin', '*');
  response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  return next();
};
