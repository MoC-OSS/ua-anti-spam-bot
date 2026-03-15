import type { GrammyContext } from '@app-types/context';

import { DELETE_ANTISEMITISM_COUNT, getRandomT } from '../i18n';

import type { DeleteObsceneMessageProperties } from './obscene.message';

export const getDeleteAntisemitismMessage = (context: GrammyContext, { writeUsername, userId, word }: DeleteObsceneMessageProperties) => {
  const atom =
    userId && writeUsername ? context.t('delete-user-atom-with-user', { userId, writeUsername }) : context.t('delete-user-atom-no-user');

  const byWord = context.t('delete-antisemitism-by-word', { word });
  const random = getRandomT(context, 'delete-antisemitism', DELETE_ANTISEMITISM_COUNT);

  return `${atom} ${byWord}\n\n${random}`;
};
