import type { MenuFlavor } from '@grammyjs/menu';
import type { Bot, CommandContext, Composer, Context, Filter, FilterQuery, MiddlewareFn, SessionFlavor } from 'grammy';

import type { SelfDestructedFlavor } from '@bot/plugins/self-destructed.plugin';

import type { ChatSessionData, ChatSessionFlavor, SessionData } from './session';
import type { State, StateFlavor } from './state';

export type GrammyContext = SelfDestructedFlavor<Context> &
  SessionFlavor<SessionData> &
  ChatSessionFlavor<ChatSessionData> &
  StateFlavor<State>;

export type GrammyMenuContext = GrammyContext & MenuFlavor;

/**
 * Real object with hidden fields
 * */
export type RealGrammyContext = GrammyContext & { tg: never; telegram: never; api: never };

export type GrammyMiddleware<TContext extends GrammyContext = GrammyContext> = MiddlewareFn<TContext>;

export type GrammyCommandMiddleware = GrammyMiddleware<CommandContext<GrammyContext>>;

export type GrammyQueryMiddleware<TQuery extends FilterQuery> = GrammyMiddleware<Filter<GrammyContext, TQuery>>;

export type GrammyBot = Bot<GrammyContext>;

export type GrammyErrorHandler = Parameters<Composer<GrammyContext>['errorBoundary']>[0];

export type GrammyFilter = (context: GrammyContext) => boolean;
