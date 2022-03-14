class TelegramUtil {
  /**
   * @param {GrammyContext} ctx
   * @returns {boolean}
   * */
  isFromChannel(ctx) {
    return ctx.from?.first_name === 'Channel' && ctx.from?.username === 'Channel_Bot';
  }

  /**
   * @param {GrammyContext} ctx
   * @returns {boolean}
   * */
  isInComments(ctx) {
    return ctx.msg?.reply_to_message?.from?.id === 777000;
  }

  /**
   * @param {Bot} bot
   * @param {number} chatId
   */
  getChatAdmins(bot, chatId) {
    return bot.api.getChatAdministrators(chatId).then((admins) => {
      if (!admins || !admins.length) {
        return {};
      }

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
