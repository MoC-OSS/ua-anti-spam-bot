import { Context, SessionFlavor } from 'grammy';

import { SessionData } from './session';

export type GrammyContext = Context & SessionFlavor<SessionData>;
