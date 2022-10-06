import type { GrammyErrorHandler } from '../types';

export const handleError = (catchError: unknown, reason = '') => {
  console.error('**** HANDLED ERROR ****', reason, catchError);
};
