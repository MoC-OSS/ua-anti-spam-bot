import type { ErrorHandler } from 'grammy';
import { GrammyError, HttpError } from 'grammy';

import type { GrammyContext } from '../types';

export const handleError = (catchError: unknown, reason = '') => {
  console.error('**** HANDLED ERROR ****', reason, catchError);
};

export const globalErrorHandler: ErrorHandler<GrammyContext> = (botError) => {
  const { ctx, error } = botError;
  console.error(`Error while handling update ${ctx.update.update_id}:`);

  if (error instanceof GrammyError) {
    console.error('**** HANDLED ERROR **** Error in request:', error.description);
  } else if (error instanceof HttpError) {
    console.error('**** HANDLED ERROR **** Could not contact Telegram:', error);
  } else {
    console.error('**** HANDLED ERROR **** Unknown error:', error);
  }
};
