import type { Context, SessionFlavor } from 'grammy';
import type { ParseModeContext } from '@grammyjs/parse-mode';

import type { SessionData } from './session';
import type { State, StateFlavor } from './state';
import type { ChatSessionFlavor, ChatSessionData } from './session';

export type GrammyContext = Context & ParseModeContext & SessionFlavor<SessionData> & ChatSessionFlavor<ChatSessionData> & StateFlavor<State>;
