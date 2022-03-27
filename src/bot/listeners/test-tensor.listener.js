const { env } = require('typed-dotenv').config();

const { getTensorTestResult } = require('../../message');

class TestTensorListener {
  /**
   * @param {TensorService} tensorService
   */
  constructor(tensorService) {
    this.tensorService = tensorService;
  }

  middleware() {
    return async (ctx, next) => {
      if (!env.TEST_TENSOR) {
        return next();
      }

      if (!ctx.msg.text) {
        ctx.reply('Пропускаю це повідомлення, тут немає тексту', { reply_to_message_id: ctx.msg.message_id });
        return;
      }

      try {
        const { numericData, isSpam, tensorRank } = await this.tensorService.predict(ctx.msg.text);

        const chance = `${(numericData[1] * 100).toFixed(4)}%`;

        ctx.replyWithHTML(getTensorTestResult({ chance, isSpam, tokenized: tensorRank }), {
          reply_to_message_id: ctx.msg.message_id,
        });
      } catch (error) {
        console.error(error);
        ctx.reply(`Cannot parse this message.\nError:\n${error.message}`, { reply_to_message_id: ctx.msg.message_id });
      }
    };
  }
}

module.exports = {
  TestTensorListener,
};
