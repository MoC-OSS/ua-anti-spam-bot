import type { GrammyMiddleware } from '../../types';

/**
 * @deprecated
 * @description Used to test global error handling
 * */
export const throwErrorMiddleware: GrammyMiddleware = () => {
  console.info('throwErrorMiddleware called');
  throw new Error('Test error');
};
