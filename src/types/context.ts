import type { Context, SessionFlavor } from 'grammy';

import type { SessionData } from './session';
import type { State, StateFlavor } from './state';

export type GrammyContext = Context & SessionFlavor<SessionData> & StateFlavor<State>;
