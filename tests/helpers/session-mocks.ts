import { mockChatSession as _mockChatSession, mockSession as _mockSession, mockState as _mockState } from '@grammyjs/testing';

import type { GrammyContext } from '@app-types/context';
import type { ChatSessionData, ChatSettings, SessionData } from '@app-types/session';
import type { State } from '@app-types/state';

type PartialChatSession = Omit<Partial<ChatSessionData>, 'chatSettings'> & {
  chatSettings?: Partial<ChatSettings>;
};

/**
 * Typed wrapper for grammy-testing's mockChatSession, pre-bound to ChatSessionData and GrammyContext.
 * @param partial - Partial chat session data to initialise the mock with.
 * @returns Mock chat-session object and middleware.
 */
export function mockChatSession(partial: PartialChatSession = {}) {
  return _mockChatSession<ChatSessionData, GrammyContext>(partial as Partial<ChatSessionData>);
}

/**
 * Typed wrapper for grammy-testing's mockSession, pre-bound to SessionData and GrammyContext.
 * @param partial - Partial session data to initialise the mock with.
 * @returns Mock session object and middleware.
 */
export function mockSession(partial: Partial<SessionData> = {}) {
  return _mockSession<SessionData, GrammyContext>(partial);
}

/**
 * Typed wrapper for grammy-testing's mockState, pre-bound to State and GrammyContext.
 * @param partial - Partial state data to initialise the mock with.
 * @returns Mock state object and middleware.
 */
export function mockState(partial: Partial<State> = {}) {
  return _mockState<State, GrammyContext>(partial);
}
