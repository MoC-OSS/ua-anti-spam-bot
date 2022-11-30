import { Composer } from 'grammy';

import type { GrammyContext } from '../../types';
import { botDemoteQuery, botInviteQuery, botKickQuery, botPromoteQuery } from '../queries';

/**
 * @description Message handling composer
 * */
export const getBeforeAnyComposer = () => {
  const beforeAnyComposer = new Composer<GrammyContext>();

  beforeAnyComposer.on('my_chat_member', botInviteQuery, botPromoteQuery, botDemoteQuery, botKickQuery);

  return { beforeAnyComposer };
};
