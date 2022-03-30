const fs = require('fs');
const { Menu } = require('@grammyjs/menu');
const { env } = require('typed-dotenv').config();

const { errorHandler } = require('../../utils');
const { trainingChat } = require('../../creator'); // creatorId
const { getTensorTestResult } = require('../../message');

const defaultTime = 10;

/**
 * @param {GrammyContext} ctx
 * */
const getAnyUsername = (ctx) => {
  const username = ctx.callbackQuery.from?.username;
  const fullName = ctx.callbackQuery.from?.last_name
    ? `${ctx.callbackQuery.from?.first_name} ${ctx.callbackQuery.from?.last_name}`
    : ctx.callbackQuery.from?.first_name;
  return username ? `@${username}` : fullName ?? '';
};

class TestTensorListener {
  /**
   * @param {TensorService} tensorService
   */
  constructor(tensorService) {
    this.tensorService = tensorService;
    this.menu = null;
    this.messageNodeTimeouts = {};
    this.messageNodeIntervals = {};
    this.storage = {};
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
    const finalMiddleware = async (ctx) => {
      clearTimeout(this.messageNodeTimeouts[this.getStorageKey(ctx)]);
      clearInterval(this.messageNodeIntervals[this.getStorageKey(ctx)]);

      delete this.messageNodeTimeouts[this.getStorageKey(ctx)];
      delete this.messageNodeIntervals[this.getStorageKey(ctx)];

      if (!this.storage[this.getStorageKey(ctx)]) {
        ctx.editMessageText(ctx.msg.text, { reply_markup: null }).catch(() => {});
        return;
      }

      if (this.storage[this.getStorageKey(ctx)].positives?.length === this.storage[this.getStorageKey(ctx)].negatives?.length) {
        ctx.editMessageText(`${this.storage[this.getStorageKey(ctx)].originalMessage}\n\nЧекаю на більше оцінок...`).catch(() => {});
        return;
      }

      const status = this.storage[this.getStorageKey(ctx)].positives.length > this.storage[this.getStorageKey(ctx)].negatives.length;
      const winUsers = status ? this.storage[this.getStorageKey(ctx)].positives : this.storage[this.getStorageKey(ctx)].negatives;

      // const winUsersText = winUsers.slice(0, 2).join(', ') + (winUsers.length > 3 ? ' та інші' : '');

      const originMessage = ctx.update.callback_query.message.reply_to_message;

      this.writeDataset(status ? 'positives' : 'negatives', originMessage.text || originMessage.caption);

      await ctx
        .editMessageText(
          `${this.storage[this.getStorageKey(ctx)].originalMessage}\n\n${winUsers.join(', ')} виділив/ли це як ${
            status ? '✅ спам' : '⛔️ не спам'
          }\nВидалю обидва повідомлення автоматично через 30 сек...`,
          {
            parse_mode: 'HTML',
            reply_markup: null,
          },
        )
        .catch(() => {});

      setTimeout(() => {
        ctx.api
          .deleteMessage(originMessage.chat.id, originMessage.message_id)
          .then(() => ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id))
          .catch(console.error);
      }, 30000);

      delete this.storage[this.getStorageKey(ctx)];
    };

    const processButtonMiddleware = errorHandler((ctx) => {
      const storage = this.storage[this.getStorageKey(ctx)];
      ctx
        .editMessageText(`${storage.originalMessage}\n\nЧекаю ${storage.time} сек...\n${new Date().toISOString()}`, {
          parse_mode: 'HTML',
        })
        .catch(() => {});

      clearTimeout(this.messageNodeTimeouts[this.getStorageKey(ctx)]);
      clearInterval(this.messageNodeIntervals[this.getStorageKey(ctx)]);
      storage.time = defaultTime;

      this.messageNodeIntervals[this.getStorageKey(ctx)] = setInterval(() => {
        storage.time -= 5;

        if (storage.time !== 0) {
          ctx
            .editMessageText(`${storage.originalMessage}\n\nЧекаю ${storage.time} сек...\n${new Date().toISOString()}`, {
              parse_mode: 'HTML',
            })
            .catch(() => {});
        }
      }, 12000);

      this.messageNodeTimeouts[this.getStorageKey(ctx)] = setTimeout(() => {
        finalMiddleware(ctx);
      }, defaultTime * 1000);
    });

    const initMenu = () => {
      this.menu = new Menu('spam-menu')
        .text(
          (ctx) => `✅ Це спам (${this.storage[this.getStorageKey(ctx)]?.positives?.length || 0})`,
          errorHandler((ctx) => {
            this.initTensorSession(ctx, ctx.msg.text);

            const username = getAnyUsername(ctx);
            this.storage[this.getStorageKey(ctx)].negatives = this.storage[this.getStorageKey(ctx)].negatives?.filter(
              (item) => item !== username,
            );
            this.storage[this.getStorageKey(ctx)].positives.push(username);

            ctx.menu.update();
            processButtonMiddleware(ctx);
          }),
        )
        .text(
          (ctx) => `⛔️ Це не спам (${this.storage[this.getStorageKey(ctx)]?.negatives?.length || 0})`,
          errorHandler((ctx) => {
            this.initTensorSession(ctx, ctx.msg.text);

            const username = getAnyUsername(ctx);
            this.storage[this.getStorageKey(ctx)].positives = this.storage[this.getStorageKey(ctx)].positives.filter(
              (item) => item !== username,
            );
            this.storage[this.getStorageKey(ctx)].negatives.push(username);

            ctx.menu.update();
            processButtonMiddleware(ctx);
          }),
        );
    };

    initMenu();

    return this.menu;
  }

  /**
   * @param {GrammyContext} ctx
   * */
  initTensorSession(ctx, message) {
    if (!this.storage[this.getStorageKey(ctx)]?.originalMessage) {
      this.storage[this.getStorageKey(ctx)] = {
        positives: [],
        negatives: [],
        originalMessage: message,
        time: defaultTime,
      };
    }
  }

  /**
   * @param {GrammyContext} ctx
   * */
  getStorageKey(ctx) {
    let chatInstance;
    if (ctx.chat) {
      chatInstance = ctx.chat.id;
    } else if (ctx.updateType === 'callback_query') {
      chatInstance = ctx.callbackQuery.chat_instance;
    } else {
      chatInstance = ctx.from.id;
    }

    return `${chatInstance}:${ctx.msg.reply_to_message?.message_id || ctx.msg.message_id}`;
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

      if (ctx.from.id !== 143875991) {
        // creatorid
        if (ctx.chat.type !== 'supergroup') {
          ctx.reply('В особистих не працюю 😝');
          return;
        }

        if (ctx.chat.id !== trainingChat) {
          ctx.reply('Я працюю тільки в одному супер чаті 😝');
          return;
        }
      }

      const message = ctx.msg.text || ctx.msg.caption;

      if (!message) {
        ctx.reply('Пропускаю це повідомлення, тут немає тексту', { reply_to_message_id: ctx.msg.message_id }).catch(() => {});
        return;
      }

      try {
        const { numericData, isSpam, fileStat } = await this.tensorService.predict(message);

        const chance = `${(numericData[1] * 100).toFixed(4)}%`;
        const tensorTestMessage = getTensorTestResult({ chance, isSpam, tensorDate: fileStat?.mtime });

        this.initTensorSession(ctx, tensorTestMessage);

        ctx
          .replyWithHTML(tensorTestMessage, {
            reply_to_message_id: ctx.msg.message_id,
            reply_markup: this.menu,
          })
          .catch(() => {});
      } catch (error) {
        console.error(error);
        ctx.reply(`Cannot parse this message.\nError:\n${error.message}`, { reply_to_message_id: ctx.msg.message_id }).catch(() => {});
      }
    };
  }
}

module.exports = {
  TestTensorListener,
};
