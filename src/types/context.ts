import type { ParseModeContext } from '@grammyjs/parse-mode';
import type { Bot, Composer, Context, Middleware, SessionFlavor } from 'grammy';

import type { ChatSessionData, ChatSessionFlavor, SessionData } from './session';
import type { State, StateFlavor } from './state';

export type GrammyContext = Context &
  ParseModeContext &
  SessionFlavor<SessionData> &
  ChatSessionFlavor<ChatSessionData> &
  StateFlavor<State>;

export type GrammyMiddleware = Middleware<GrammyContext>;

export type GrammyBot = Bot<GrammyContext>;
export type GrammyErrorHandler = Parameters<Composer<GrammyContext>['errorBoundary']>[0];
