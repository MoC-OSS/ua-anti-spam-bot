import { DELETE_OBSCENE_COUNT, getRandomT, WARN_OBSCENE_COUNT } from '@bot/i18n';

import type { GrammyContext } from '@app-types/context';

import type { DeleteMessageAtomProperties } from './shared.message';

export interface DeleteObsceneMessageProperties extends DeleteMessageAtomProperties {
  word: string;
}

export const getWarnObsceneMessage = (context: GrammyContext) => getRandomT(context, 'warn-obscene', WARN_OBSCENE_COUNT);

export const getDeleteObsceneMessage = (context: GrammyContext, { writeUsername, userId, word }: DeleteObsceneMessageProperties) => {
  const atom =
    userId && writeUsername ? context.t('delete-user-atom-with-user', { userId, writeUsername }) : context.t('delete-user-atom-no-user');

  const byWord = context.t('delete-obscene-by-word', { word });
  const random = getRandomT(context, 'delete-obscene', DELETE_OBSCENE_COUNT);

  return `${atom} ${byWord}\n\n${random}`;
};
