import type { MenuFlavor } from '@grammyjs/menu';
import type { ParseModeFlavor } from '@grammyjs/parse-mode';
import type { Bot, CommandContext, Composer, Context, Filter, FilterQuery, MiddlewareFn, SessionFlavor } from 'grammy';

import type { ChatSessionData, ChatSessionFlavor, SessionData } from './session';
import type { State, StateFlavor } from './state';

export type GrammyContext = ParseModeFlavor<Context> & SessionFlavor<SessionData> & ChatSessionFlavor<ChatSessionData> & StateFlavor<State>;

export type GrammyMenuContext = GrammyContext & MenuFlavor;

/**
 * Real object with hidden fields
 * */
export type RealGrammyContext = GrammyContext & { tg: any; telegram: any; api: any };

export type GrammyMiddleware<C extends GrammyContext = GrammyContext> = MiddlewareFn<C>;
export type GrammyCommandMiddleware = GrammyMiddleware<CommandContext<GrammyContext>>;
export type GrammyQueryMiddleware<Q extends FilterQuery> = GrammyMiddleware<Filter<GrammyContext, Q>>;

export type GrammyBot = Bot<GrammyContext>;
export type GrammyErrorHandler = Parameters<Composer<GrammyContext>['errorBoundary']>[0];

export type GrammyFilter = (context: GrammyContext) => boolean;
