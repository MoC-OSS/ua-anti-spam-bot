import { isChannel } from 'grammy-guard';

import type { GrammyFilter } from '@app-types/context';

export const isNotChannel: GrammyFilter = (context) => !isChannel(context);
