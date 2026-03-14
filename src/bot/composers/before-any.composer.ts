import { Composer } from 'grammy';

import { botDemoteQuery } from '@bot/queries/bot-demote.query';
import { botInviteQuery } from '@bot/queries/bot-invite.query';
import { botKickQuery } from '@bot/queries/bot-kick.query';
import { botPromoteQuery } from '@bot/queries/bot-promote.query';

import type { GrammyContext } from '@app-types/context';

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
