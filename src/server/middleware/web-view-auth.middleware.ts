import type { NextFunction, Request, Response } from 'express';

import { verifyTelegramWebAppData } from '@server/verify-telegram-web-app-data';

/**
 * Express middleware that validates incoming requests using Telegram Web App authentication.
 * @param request - The incoming Express request object.
 * @param response - The outgoing Express response object.
 * @param next - The next middleware function in the chain.
 * @returns A 403 JSON response if unauthorized, or the result of calling next().
 */
export const validateMiddleware = (request: Request, response: Response, next: NextFunction) => {
  const isValid = verifyTelegramWebAppData(request.headers.authorization as string);

  if (!isValid) {
    return response.status(403).json({ message: 'Unauthorized' });
  }

  return next();
};
