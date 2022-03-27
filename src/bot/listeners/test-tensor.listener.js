const fs = require('fs');
const { Menu } = require('@grammyjs/menu');
const { env } = require('typed-dotenv').config();

const { trainingChat } = require('../../creator');
const { getTensorTestResult } = require('../../message');

class TestTensorListener {
  /**
   * @param {TensorService} tensorService
   */
  constructor(tensorService) {
    this.tensorService = tensorService;
    this.menu = null;
  }

  writeDataset(state, word) {
    const writeFunction = (path) => {
      if (!fs.existsSync(path)) {
        fs.writeFileSync(path, '[]');
      }

      const file = JSON.parse(fs.readFileSync(path));
      const newFile = [...new Set([...file, word])];

      fs.writeFileSync(path, `${JSON.stringify(newFile, null, 2)}\n`);
    };

    switch (state) {
      case 'positives': {
        return writeFunction('./positives.json');
      }

      case 'negatives': {
        return writeFunction('./negatives.json');
      }

      default:
        throw new Error(`Invalid state: ${state}`);
    }
  }

  initMenu() {
    /**
     * @param {GrammyContext} ctx
     * */
    const finalMiddleware = async (ctx, status) => {
      const username = ctx.from?.username;
      const fullName = ctx.from?.last_name ? `${ctx.from?.first_name} ${ctx.from?.last_name}` : ctx.from?.first_name;
      const writeUsername = username ? `@${username}` : fullName ?? '';
      await ctx
        .editMessageText(`${ctx.msg.text}\n\n${writeUsername} виділив це як ${status ? '✅ спам' : '⛔️ не спам'}`, {
          reply_markup: null,
        })
        .catch(() => {});
    };

    this.menu = new Menu('spam-menu')
      .text('✅ Це спам', (ctx) => {
        this.writeDataset('positives', ctx.update.callback_query.message.reply_to_message.text);
        finalMiddleware(ctx, true);
      })
      .text('⛔️ Це не спам', (ctx) => {
        this.writeDataset('negatives', ctx.update.callback_query.message.reply_to_message.text);
        finalMiddleware(ctx, false);
      });

    return this.menu;
  }

  middleware() {
    /**
     * @param {GrammyContext} ctx
     * @param {Next} next
     * */
    return async (ctx, next) => {
      if (!env.TEST_TENSOR) {
        return next();
      }

      if (ctx.chat.type !== 'supergroup') {
        ctx.reply('В особистих не працюю 😝');
        return;
      }

      if (ctx.chat.id !== trainingChat) {
        ctx.reply('Я працюю тільки в одному супер чаті 😝');
        return;
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
          reply_markup: this.menu,
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
