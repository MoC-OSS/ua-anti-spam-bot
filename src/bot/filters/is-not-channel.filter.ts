import { isChannel } from 'grammy-guard';

import type { GrammyFilter } from '../../types';

export const isNotChannel: GrammyFilter = (context) => !isChannel(context);
