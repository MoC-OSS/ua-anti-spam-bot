export interface DeleteMessageAtomProperties {
  writeUsername: string;
  userId?: number;
}

export const getDeleteUserAtomMessage = ({ writeUsername, userId }: DeleteMessageAtomProperties) =>
  userId && writeUsername
    ? `❗️ <a href="tg://user?id=${userId}">${writeUsername}</a>, <b>повідомлення видалено</b>.`
    : '❗️ <b>Повідомлення видалено</b>.';
