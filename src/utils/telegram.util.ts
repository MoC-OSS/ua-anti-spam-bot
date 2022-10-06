class TelegramUtil {
  /**
   * @param {GrammyContext} ctx
   * @returns {boolean}
   * */
  isFromChannel(context) {
    return context.from?.first_name === 'Channel' && context.from?.username === 'Channel_Bot';
  }

  /**
   * @param {GrammyContext} ctx
   * @returns {boolean}
   * */
  isInComments(context) {
    return context.msg?.reply_to_message?.from?.id === 777_000;
  }

  /**
   * @param {Bot} bot
   * @param {number} chatId
   */
  getChatAdmins(bot, chatId) {
    return bot.api.getChatAdministrators(chatId).then((admins) => {
      if (!admins || admins.length === 0) {
        return {};
      }

      const creator = admins.find((user) => user.status === 'creator' && !!user.user.username);
      const promoteAdmins = admins.filter((user) => user.can_promote_members && !!user.user.username);

      const finalAdmins = [creator, ...promoteAdmins].filter(Boolean);
      const adminsString = finalAdmins.length > 0 ? `${finalAdmins.map((user) => `@${user.user.username}`).join(', ')} ` : '';

      return { creator, admins, promoteAdmins, adminsString, finalAdmins };
    });
  }
}

module.exports = {
  TelegramUtil,
};
