class TelegramUtil {
  /**
   * @param {TelegrafContext} ctx
   * @returns {boolean}
   * */
  isFromChannel(ctx) {
    return ctx?.message?.from?.first_name === 'Channel' && ctx?.message?.from?.username === 'Channel_Bot';
  }

  /**
   * @param {TelegrafContext} ctx
   * @returns {boolean}
   * */
  isInComments(ctx) {
    return ctx?.message?.reply_to_message?.from?.id === 777000;
  }

  /**
   * @param {TelegrafContext} ctx
   * @returns {string}
   * */
  getMessageText(ctx) {
    return this.getMessage(ctx).text;
  }

  /**
   * @param {TelegrafContext} ctx
   * @returns {AbstractCallbackQuery}
   * */
  getMessage(ctx) {
    return ctx.message || ctx.update?.message || ctx.update?.edited_message || ctx.update?.my_chat_member;
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
