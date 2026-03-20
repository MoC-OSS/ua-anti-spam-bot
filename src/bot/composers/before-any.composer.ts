import { Composer } from 'grammy';

import { botDemoteQuery } from '@bot/queries/bot-demote.query';
import { botInviteQuery } from '@bot/queries/bot-invite.query';
import { botKickQuery } from '@bot/queries/bot-kick.query';
import { botPromoteQuery } from '@bot/queries/bot-promote.query';

import type { GrammyContext } from '@app-types/context';

/**
 * Composer that runs before all other composers to enrich context with admin status and handle chat member events.
 * @returns An object containing the beforeAnyComposer instance.
 */
export const getBeforeAnyComposer = () => {
  const beforeAnyComposer = new Composer<GrammyContext>();

  beforeAnyComposer.on('my_chat_member', botInviteQuery, botPromoteQuery, botDemoteQuery, botKickQuery);

  beforeAnyComposer.on('message', async (context, next) => {
    const fromId: number | undefined = context.from?.id;

    if (!fromId) {
      return next();
    }

    const chatMember = context.chat?.type === 'private' ? null : await context.getChatMember(fromId);
    const isActualUserAdmin = context.chat?.type === 'private' ? true : ['creator', 'administrator'].includes(chatMember?.status ?? '');

    if (context.session) {
      context.session.isCurrentUserAdmin = isActualUserAdmin;
    }

    context.state.isActualUserAdmin = isActualUserAdmin;
    context.state.isUserAdmin = isActualUserAdmin && context.session?.roleMode !== 'user';

    return next();
  });

  return { beforeAnyComposer };
};
