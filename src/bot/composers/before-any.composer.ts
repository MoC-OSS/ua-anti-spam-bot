import { Composer } from 'grammy';

import type { GrammyContext } from '../../types';
import { botDemoteQuery, botInviteQuery, botKickQuery, botPromoteQuery } from '../queries';

/**
 * @description Message handling composer
 * */
export const getBeforeAnyComposer = () => {
  const beforeAnyComposer = new Composer<GrammyContext>();

  beforeAnyComposer.on('my_chat_member', botInviteQuery, botPromoteQuery, botDemoteQuery, botKickQuery);

  beforeAnyComposer.on('message', async (context, next) => {
    const fromId: number | undefined = context.from?.id;
    if (!fromId) {
      return next();
    }

    if (context.chat?.type === 'private') {
      context.state.isUserAdmin = true;
      return next();
    }

    const chatMember = await context.getChatMember(fromId);
    context.state.isUserAdmin = ['creator', 'administrator'].includes(chatMember.status);
    return next();
  });

  return { beforeAnyComposer };
};
