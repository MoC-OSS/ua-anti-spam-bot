import type { Bot } from 'grammy';
import { Composer } from 'grammy';

import type { GrammyContext } from '../../types';
import { botDemoteQuery, botInviteQuery, botKickQuery, botPromoteQuery } from '../queries';

export interface BeforeAnyComposerProperties {
  bot: Bot<GrammyContext>;
}

/**
 * @description Message handling composer
 * */
export const getBeforeAnyComposer = ({ bot }: BeforeAnyComposerProperties) => {
  const beforeAnyComposer = new Composer<GrammyContext>();

  beforeAnyComposer.on('my_chat_member', botInviteQuery(bot), botPromoteQuery, botDemoteQuery, botKickQuery);

  return { beforeAnyComposer };
};
