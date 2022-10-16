import type { MenuFlavor } from '@grammyjs/menu/out/menu';
import type { ParseModeContext } from '@grammyjs/parse-mode';
import type { Bot, Composer, Context, MiddlewareFn, SessionFlavor } from 'grammy';

import type { ChatSessionData, ChatSessionFlavor, SessionData } from './session';
import type { State, StateFlavor } from './state';

export type GrammyContext = Context &
  ParseModeContext &
  SessionFlavor<SessionData> &
  ChatSessionFlavor<ChatSessionData> &
  StateFlavor<State>;

export type GrammyMenuContext = GrammyContext & MenuFlavor;

/**
 * Real object with hidden fields
 * */
export type RealGrammyContext = GrammyContext & { tg: any; telegram: any; api: any };

export type GrammyMiddleware = MiddlewareFn<GrammyContext>;

export type GrammyBot = Bot<GrammyContext>;
export type GrammyErrorHandler = Parameters<Composer<GrammyContext>['errorBoundary']>[0];
