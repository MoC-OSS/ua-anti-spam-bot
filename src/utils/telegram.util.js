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
}

module.exports = {
  TelegramUtil,
};
