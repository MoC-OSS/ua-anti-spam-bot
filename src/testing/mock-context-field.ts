import type { Context, MiddlewareFn } from 'grammy';
import type { PartialDeep } from 'type-fest';

export interface MockContextFieldReturnType<C extends Context, F extends keyof C> {
  mocked: C[F];
  middleware: MiddlewareFn<C>;
}

/**
 * Mock field with strict partial typing and dynamically changing it for testing
 *
 * @example
 * ```ts
 * export interface MockSessionResult<
 *   R extends MockContextFieldReturnType<GrammyContext, 'session'> = MockContextFieldReturnType<GrammyContext, 'session'>,
 * > {
 *   session: R['mocked'];
 *   mockSessionMiddleware: R['middleware'];
 * }
 *
 * export const mockSession = mockContextField<GrammyContext, 'session', MockSessionResult>('session', ({ mocked, middleware }) => ({
 *   session: mocked,
 *   mockSessionMiddleware: middleware,
 * }));
 * ```
 * */
export const mockContextField =
  <C extends Context, F extends keyof C, R>(fieldName: F, remap: (value: MockContextFieldReturnType<C, F>) => R) =>
  (mocked: PartialDeep<C[F]>) =>
    remap({
      mocked: mocked as C[F],
      middleware: (context, next) => {
        context[fieldName] = mocked as C[F];
        return next();
      },
    });
