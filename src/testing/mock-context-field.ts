import type { Context, MiddlewareFn } from 'grammy';

import type { PartialDeep } from 'type-fest';

export interface MockContextFieldReturnType<TContext extends Context, TField extends keyof TContext> {
  mocked: TContext[TField];
  middleware: MiddlewareFn<TContext>;
}

// eslint-disable-next-line no-secrets/no-secrets
/**
 * Mock field with strict partial typing and dynamically changing it for testing
 * @param fieldName
 * @param remap
 * @example
 * ```ts
 * export interface MockSessionResult<
 *   TResult extends MockContextFieldReturnType<GrammyContext, 'session'> = MockContextFieldReturnType<GrammyContext, 'session'>,
 * > {
 *   session: TResult['mocked'];
 *   mockSessionMiddleware: TResult['middleware'];
 * }
 *
 * export const mockSession = mockContextField<GrammyContext, 'session', MockSessionResult>('session', ({ mocked, middleware }) => ({
 *   session: mocked,
 *   mockSessionMiddleware: middleware,
 * }));
 * ```
 */
export const mockContextField =
  <TContext extends Context, TField extends keyof TContext, TResult>(
    fieldName: TField,
    remap: (value: MockContextFieldReturnType<TContext, TField>) => TResult,
  ) =>
  (mocked: PartialDeep<TContext[TField]>) =>
    remap({
      mocked: mocked as TContext[TField],
      middleware: (context, next) => {
        // eslint-disable-next-line security/detect-object-injection
        context[fieldName] = mocked as TContext[TField];

        return next();
      },
    });
