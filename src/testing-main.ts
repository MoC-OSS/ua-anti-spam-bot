import type { MockContextFieldReturnType } from './testing/mock-context-field';
import { mockContextField } from './testing/mock-context-field';
import type { GrammyContext } from './types';

/**
 * Mock Session
 * */
export interface MockSessionResult<
  R extends MockContextFieldReturnType<GrammyContext, 'session'> = MockContextFieldReturnType<GrammyContext, 'session'>,
> {
  session: R['mocked'];
  mockSessionMiddleware: R['middleware'];
}

export const mockSession = mockContextField<GrammyContext, 'session', MockSessionResult>('session', ({ mocked, middleware }) => ({
  session: mocked,
  mockSessionMiddleware: middleware,
}));

/**
 * Mock Chat Session
 * */
export interface MockChatSessionResult<
  R extends MockContextFieldReturnType<GrammyContext, 'chatSession'> = MockContextFieldReturnType<GrammyContext, 'chatSession'>,
> {
  chatSession: R['mocked'];
  mockChatSessionMiddleware: R['middleware'];
}

export const mockChatSession = mockContextField<GrammyContext, 'chatSession', MockChatSessionResult>(
  'chatSession',
  ({ mocked, middleware }) =>
    ({
      chatSession: mocked,
      mockChatSessionMiddleware: middleware,
    } as const),
);

/**
 * Mock State
 * */
export interface MockStateResult<
  R extends MockContextFieldReturnType<GrammyContext, 'state'> = MockContextFieldReturnType<GrammyContext, 'state'>,
> {
  state: R['mocked'];
  mockStateMiddleware: R['middleware'];
}

export const mockState = mockContextField<GrammyContext, 'state', MockStateResult>('state', ({ mocked, middleware }) => ({
  state: mocked,
  mockStateMiddleware: middleware,
}));
