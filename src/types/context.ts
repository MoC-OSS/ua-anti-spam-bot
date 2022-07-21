import type { Bot, Context, SessionFlavor, Composer, Middleware } from 'grammy';
import type { ParseModeContext } from '@grammyjs/parse-mode';

import type { SessionData } from './session';
import type { State, StateFlavor } from './state';
import type { ChatSessionFlavor, ChatSessionData } from './session';

export type GrammyContext = Context & ParseModeContext & SessionFlavor<SessionData> & ChatSessionFlavor<ChatSessionData> & StateFlavor<State>;
export type GrammyMiddleware = Middleware<GrammyContext>;

export type GrammyBot = Bot<GrammyContext>;
export type GrammyErrorHandler = Parameters<Composer<GrammyContext>['errorBoundary']>[0];
