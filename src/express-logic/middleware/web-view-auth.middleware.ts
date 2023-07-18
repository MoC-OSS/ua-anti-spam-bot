import type { NextFunction, Request, Response } from 'express';

import { verifyTelegramWebAppData } from '../index';

export const validateMiddleware = (request: Request, response: Response, next: NextFunction) => {
  const isValid = verifyTelegramWebAppData(request.headers.authorization as string);
  if (!isValid) {
    return response.status(403).json({ message: 'Unauthorized' });
  }

  next();
};
