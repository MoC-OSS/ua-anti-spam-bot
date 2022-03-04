class TelegramUtil {
  isFromChannel(ctx) {
    return ctx?.message?.from?.first_name === 'Channel' && ctx?.message?.from?.username === 'Channel_Bot';
  }

  isInComments(ctx) {
    return ctx?.message?.reply_to_message?.from?.id === 777000;
  }

  getMessage(ctx) {
    return ctx?.message?.text || ctx?.update?.message?.text;
  }

  /**
   * @param {Telegraf} bot
   * @param {number} chatId
   */
  getChatAdmins(bot, chatId) {
    return bot.telegram.getChatAdministrators(chatId).then((admins) => {
      if (!admins || !admins.length) {
        return;
      }

      /**
       * @type {ChatMember}
       * */
      const creator = admins.find((user) => user.status === 'creator' && !!user.user.username);
      const promoteAdmins = admins.filter((user) => user.can_promote_members && !!user.user.username);

      const finalAdmins = [creator, ...promoteAdmins].filter(Boolean);
      const adminsString = finalAdmins.length ? `${finalAdmins.map((user) => `@${user.user.username}`).join(', ')} ` : '';

      return { creator, admins, promoteAdmins, adminsString, finalAdmins };
    });
  }
}

module.exports = {
  TelegramUtil,
};
