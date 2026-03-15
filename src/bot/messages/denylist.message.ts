import { DELETE_DENYLIST_COUNT, getRandomT } from '@bot/i18n';

import type { GrammyContext } from '@app-types/context';

import type { DeleteObsceneMessageProperties } from './obscene.message';

export const getDeleteDenylistMessage = (context: GrammyContext, { writeUsername, userId, word }: DeleteObsceneMessageProperties) => {
  const atom =
    userId && writeUsername ? context.t('delete-user-atom-with-user', { userId, writeUsername }) : context.t('delete-user-atom-no-user');

  const byWord = context.t('delete-denylist-by-word', { word });
  const random = getRandomT(context, 'delete-denylist', DELETE_DENYLIST_COUNT);

  return `${atom} ${byWord}\n${random}`;
};
