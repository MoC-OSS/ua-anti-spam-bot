import type { Context, MiddlewareFn } from 'grammy';
import type { PartialDeep } from 'type-fest';

export interface MockContextFieldReturnType<C extends Context, V extends C[keyof C]> {
  mocked: V;
  middleware: MiddlewareFn<C>;
}

/**
 * Mock field with strict partial typing and dynamically changing it for testing
 *
 * @example
 * ```ts
 * export const mockSession = mockContextField<GrammyContext, 'session'>('session');
 * ```
 * */
export const mockContextField =
  <C extends Context, F extends keyof C>(fieldName: F) =>
  (mocked: PartialDeep<C[F]>): MockContextFieldReturnType<C, C[F]> => ({
    mocked: mocked as C[F],
    middleware: (context, next) => {
      context[fieldName] = mocked as C[F];
      return next();
    },
  });
