import { Context } from "telegraf"

import { SessionData } from './session';

export interface TelegrafContext extends Omit<Context, 'session'> {
  session: SessionData;
}
