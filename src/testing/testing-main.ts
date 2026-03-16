import type { GrammyContext } from '@app-types/context';

import type { MockContextFieldReturnType } from './mock-context-field';
import { mockContextField } from './mock-context-field';

/**
 * Mock Session
 */
export interface MockSessionResult<
  TResult extends MockContextFieldReturnType<GrammyContext, 'session'> = MockContextFieldReturnType<GrammyContext, 'session'>,
> {
  session: TResult['mocked'];
  mockSessionMiddleware: TResult['middleware'];
}

export const mockSession = mockContextField<GrammyContext, 'session', MockSessionResult>('session', ({ mocked, middleware }) => ({
  session: mocked,
  mockSessionMiddleware: middleware,
}));

/**
 * Mock Chat Session
 */
export interface MockChatSessionResult<
  TResult extends MockContextFieldReturnType<GrammyContext, 'chatSession'> = MockContextFieldReturnType<GrammyContext, 'chatSession'>,
> {
  chatSession: TResult['mocked'];
  mockChatSessionMiddleware: TResult['middleware'];
}

export const mockChatSession = mockContextField<GrammyContext, 'chatSession', MockChatSessionResult>(
  'chatSession',
  ({ mocked, middleware }) =>
    ({
      chatSession: mocked,
      mockChatSessionMiddleware: middleware,
    }) as const,
);

/**
 * Mock State
 */
export interface MockStateResult<
  TResult extends MockContextFieldReturnType<GrammyContext, 'state'> = MockContextFieldReturnType<GrammyContext, 'state'>,
> {
  state: TResult['mocked'];
  mockStateMiddleware: TResult['middleware'];
}

export const mockState = mockContextField<GrammyContext, 'state', MockStateResult>('state', ({ mocked, middleware }) => ({
  state: mocked,
  mockStateMiddleware: middleware,
}));
