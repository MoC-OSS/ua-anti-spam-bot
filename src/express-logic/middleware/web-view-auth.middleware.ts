import type { NextFunction, Request, Response } from 'express';

import { verifyTelegramWebAppData } from '@express-logic/verify-telegram-web-app-data';

/** Express middleware that validates incoming requests using Telegram Web App authentication. */
export const validateMiddleware = (request: Request, response: Response, next: NextFunction) => {
  const isValid = verifyTelegramWebAppData(request.headers.authorization as string);

  if (!isValid) {
    return response.status(403).json({ message: 'Unauthorized' });
  }

  return next();
};
