import * as fs from 'node:fs';
import { RawApi } from 'grammy';

import { TensorService } from '../../tensor/tensor.service';
import { errorHandler } from '../../utils/error-handler';

import { Menu } from '@grammyjs/menu';
import { env } from 'typed-dotenv'.config();

import { redisService } from '../../services/redis.service';

import { creatorId, trainingChat } from '../../creator';
import { getTensorTestResult } from '../../message';
import { googleService } from '../../services/google.service';
import { GrammyContext } from '../../types';

const defaultTime = 30;
const removeTime = 30;

/**
 * @param {GrammyContext} ctx
 * */
const getAnyUsername = (context) => {
  const username = context.callbackQuery.from?.username;
  const fullName = context.callbackQuery.from?.last_name
    ? `${context.callbackQuery.from?.first_name} ${context.callbackQuery.from?.last_name}`
    : context.callbackQuery.from?.first_name;
  return username ? `@${username}` : fullName ?? '';
};

export class TestTensorListener {
  /**
   * @param {TensorService} tensorService
   */
  tensorService: TensorService;

  menu: any;

  messageNodeTimeouts: any;

  messageNodeIntervals: any;

  storage: any;

  constructor(tensorService) {
    this.tensorService = tensorService;
    this.menu = null;
    this.messageNodeTimeouts = {};
    this.messageNodeIntervals = {};
    this.storage = {};
  }

  writeDataset(state, word) {
    // eslint-disable-next-line no-unused-vars
    const writeInFileFunction = () => {
      const fileName = `./${state}.json`;

      if (!fs.existsSync(fileName)) {
        fs.writeFileSync(fileName, '[]');
      }

      const file = JSON.parse(fs.readFileSync(fileName, 'utf8') || '[]');
      const newFile = [...new Set([...file, word])];

      fs.writeFileSync(fileName, `${JSON.stringify(newFile, null, 2)}\n`);
    };

    // eslint-disable-next-line no-unused-vars
    const writeInRedisFunction = () => {
      switch (state) {
        case 'negatives':
          return redisService.updateNegatives(word);

        case 'positives':
          return redisService.updatePositives(word);

        default:
          throw new Error(`Invalid state: ${state}`);
      }
    };

    const writeInGoogleSheetFunction = () => {
      const sheetId = env.GOOGLE_SPREADSHEET_ID;
      const sheetPositiveName = env.GOOGLE_POSITIVE_SHEET_NAME;
      const sheetNegativeName = env.GOOGLE_NEGATIVE_SHEET_NAME;
      switch (state) {
        case 'negatives':
          return googleService.appendToSheet(sheetId, sheetNegativeName, word);
        case 'positives':
          return googleService.appendToSheet(sheetId, sheetPositiveName, word);
        default:
          throw new Error(`Invalid state: ${state}`);
      }
    };

    switch (state) {
      case 'negatives':
      case 'positives':
        // return writeInFileFunction();
        // return writeInRedisFunction();
        return writeInGoogleSheetFunction();

      default:
        throw new Error(`Invalid state: ${state}`);
    }
  }

  /**
   * @param {Transformer<RawApi>} throttler - throttler need to be defined once to work.
   * So we can't init it each time in middleware because it has new instance, and it doesn't throttle,
   * */
  initMenu(throttler: RawApi) {
    /**
     * @param context
     * */
    const finalMiddleware = async (context: GrammyContext) => {
      const storage = this.storage[this.getStorageKey(context)];

      clearTimeout(this.messageNodeTimeouts[this.getStorageKey(context)]);
      clearInterval(this.messageNodeIntervals[this.getStorageKey(context)]);

      delete this.messageNodeTimeouts[this.getStorageKey(context)];
      delete this.messageNodeIntervals[this.getStorageKey(context)];

      if (!storage) {
        context.editMessageText(context.msg?.text || '', { reply_markup: undefined }).catch(() => {});
        return;
      }

      const positivesCount = storage.positives?.length;
      const negativesCount = storage.negatives?.length;
      const skipsCount = storage.skips?.length;

      if (
        (positivesCount === negativesCount && positivesCount !== 0) ||
        (positivesCount === skipsCount && skipsCount !== 0) ||
        (negativesCount === skipsCount && negativesCount !== 0)
      ) {
        context.editMessageText(`${storage.originalMessage}\n\nЧекаю на більше оцінок...`).catch(() => {});
        return;
      }

      let status: boolean | null = null;
      if (positivesCount > negativesCount && positivesCount > skipsCount) {
        status = true;
      } else if (negativesCount > positivesCount && negativesCount > skipsCount) {
        status = false;
      }

      let winUsers = [];
      if (status === true) {
        winUsers = storage.positives;
      } else if (status === false) {
        winUsers = storage.negatives;
      } else {
        winUsers = storage.skips;
      }

      // const winUsersText = winUsers.slice(0, 2).join(', ') + (winUsers.length > 3 ? ' та інші' : '');

      const originMessage = context.update.callback_query.message.reply_to_message;

      if (status === true) {
        this.writeDataset('positives', originMessage.text || originMessage.caption);
      } else if (status === false) {
        this.writeDataset('negatives', originMessage.text || originMessage.caption);
      }

      let text = '⏭ пропуск';
      if (status === true) {
        text = '✅ спам';
      } else if (status === false) {
        text = '⛔️ не спам';
      }

      /**
       * We need to use throttler for Test Tensor because telegram could ban the bot
       * */
      context.api.config.use(throttler);

      await context
        .editMessageText(
          `${storage.originalMessage}\n\n${winUsers.join(
            ', ',
          )} виділив/ли це як ${text}\nВидалю обидва повідомлення автоматично через ${removeTime} сек...\n${new Date().toISOString()}`,
          {
            parse_mode: 'HTML',
            reply_markup: null,
          },
        )
        .catch(() => {});

      setTimeout(() => {
        context.api
          .deleteMessage(originMessage.chat.id, originMessage.message_id)
          .then(() => context.api.deleteMessage(context.chat.id, context.msg.message_id))
          .catch(console.error);
      }, removeTime * 1000);

      delete this.storage[this.getStorageKey(context)];
    };

    const processButtonMiddleware = errorHandler((context) => {
      const storage = this.storage[this.getStorageKey(context)];
      context
        .editMessageText(`${storage.originalMessage}\n\nЧекаю ${storage.time} сек...\n${new Date().toISOString()}`, {
          parse_mode: 'HTML',
        })
        .catch(() => {});

      clearTimeout(this.messageNodeTimeouts[this.getStorageKey(context)]);
      clearInterval(this.messageNodeIntervals[this.getStorageKey(context)]);
      storage.time = defaultTime;

      this.messageNodeIntervals[this.getStorageKey(context)] = setInterval(() => {
        storage.time -= 5;

        if (storage.time !== 0) {
          context
            .editMessageText(`${storage.originalMessage}\n\nЧекаю ${storage.time} сек...\n${new Date().toISOString()}`, {
              parse_mode: 'HTML',
            })
            .catch(() => {});
        }
      }, defaultTime * 1000 + 2000);

      this.messageNodeTimeouts[this.getStorageKey(context)] = setTimeout(() => {
        finalMiddleware(context);
      }, defaultTime * 1000);
    });

    const initMenu = () => {
      this.menu = new Menu('spam-menu')
        .text(
          (context) => `✅ Це спам (${this.storage[this.getStorageKey(context)]?.positives?.length || 0})`,
          errorHandler((context) => {
            this.initTensorSession(context, context.msg.text);

            const storage = this.storage[this.getStorageKey(context)];
            const username = getAnyUsername(context);
            storage.negatives = storage.negatives?.filter((item) => item !== username);
            storage.skips = storage.skips.filter((item) => item !== username);
            if (!storage.positives.includes(username)) {
              storage.positives.push(username);
            }

            context.menu.update();
            processButtonMiddleware(context, null);
          }),
        )
        .text(
          (context) => `⛔️ Це не спам (${this.storage[this.getStorageKey(context)]?.negatives?.length || 0})`,
          errorHandler((context) => {
            this.initTensorSession(context, context.msg.text);

            const storage = this.storage[this.getStorageKey(context)];
            const username = getAnyUsername(context);
            storage.positives = storage.positives.filter((item) => item !== username);
            storage.skips = storage.skips.filter((item) => item !== username);
            if (!storage.negatives.includes(username)) {
              storage.negatives.push(username);
            }

            context.menu.update();
            processButtonMiddleware(context, null);
          }),
        )
        .row()
        .text(
          (context) => `⏭ Пропустити (${this.storage[this.getStorageKey(context)]?.skips?.length || 0})`,
          errorHandler((context) => {
            this.initTensorSession(context, context.msg.text);

            const storage = this.storage[this.getStorageKey(context)];
            const username = getAnyUsername(context);
            storage.positives = storage.positives.filter((item) => item !== username);
            storage.negatives = storage.negatives?.filter((item) => item !== username);
            if (!storage.skips.includes(username)) {
              storage.skips.push(username);
            }

            context.menu.update();
            processButtonMiddleware(context, null);
          }),
        );
    };

    initMenu();

    return this.menu;
  }

  /**
   * @param {GrammyContext} ctx
   * */
  initTensorSession(context, message) {
    if (!this.storage[this.getStorageKey(context)]?.originalMessage) {
      this.storage[this.getStorageKey(context)] = {
        positives: [],
        negatives: [],
        skips: [],
        originalMessage: message,
        time: defaultTime,
      };
    }
  }

  /**
   * @param {GrammyContext} ctx
   * */
  getStorageKey(context) {
    let chatInstance;
    if (context.chat) {
      chatInstance = context.chat.id;
    } else if (context.updateType === 'callback_query') {
      chatInstance = context.callbackQuery.chat_instance;
    } else {
      chatInstance = context.from.id;
    }

    return `${chatInstance}:${context.msg.reply_to_message?.message_id || context.msg.message_id}`;
  }

  /**
   * @param {Transformer} throttler - throttler need to be defined once to work.
   * So we can't init it each time in middleware because it has new instance, and it doesn't throttle,
   * */
  middleware(throttler) {
    /**
     * @param {GrammyContext} ctx
     * @param {Next} next
     * */
    return async (context, next) => {
      if (context.chat.id !== trainingChat && !env.TEST_TENSOR) {
        return next();
      }

      /**
       * We need to use throttler for Test Tensor because telegram could ban the bot
       * */
      context.api.config.use(throttler);

      if (context.from.id !== creatorId) {
        if (context.chat.type !== 'supergroup') {
          context.reply('В особистих не працюю 😝');
          return;
        }

        if (context.chat.id !== trainingChat) {
          context.reply('Я працюю тільки в одному супер чаті 😝');
          return;
        }
      }

      const message = context.msg.text || context.msg.caption;

      if (!message) {
        context.api.deleteMessage(context.chat.id, context.msg.message_id).catch();
        return;
      }

      try {
        const { spamRate, isSpam, fileStat } = await this.tensorService.predict(message, null);

        const chance = `${(spamRate * 100).toFixed(4)}%`;
        const tensorTestMessage = getTensorTestResult({ chance, isSpam, tensorDate: fileStat?.mtime });

        this.initTensorSession(context, tensorTestMessage);

        context
          .replyWithHTML(tensorTestMessage, {
            reply_to_message_id: context.msg.message_id,
            reply_markup: this.menu,
          })
          .catch(() => {});
      } catch (error: any) {
        console.error(error);
        context
          .reply(`Cannot parse this message.\nError:\n${error.message}`, { reply_to_message_id: context.msg.message_id })
          .catch(() => {});
      }
    };
  }
}
