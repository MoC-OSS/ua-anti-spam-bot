import * as fs from 'node:fs';

import { Menu } from '@grammyjs/menu';
import type { Transformer } from 'grammy';

import { GOOGLE_SHEETS_NAMES } from '@const/google-sheets.const';

import { getTensorTestResult } from '@message';

import { googleService } from '@services/google.service';
import { redisService } from '@services/redis.service';

import type { TensorService } from '@tensor/tensor.service';

import type { GrammyContext, GrammyMenuContext, GrammyMiddleware } from '@app-types/context';

import { emptyFunction, emptyPromiseFunction } from '@utils/empty-functions.util';
import { wrapperErrorHandler } from '@utils/error-handler';

import { environmentConfig } from '../../config';
import { creatorId, trainingChat } from '../../creator';

const defaultTime = 30;
const removeTime = 30;

export interface TestTensorStorage {
  positives?: string[];
  negatives?: string[];
  skips?: string[];
  originalMessage: string;
  time: number;
}

/**
 * @param {GrammyContext} context
 * */
const getAnyUsername = (context: GrammyContext) => {
  const username = context.callbackQuery?.from?.username;

  const fullName = context.callbackQuery?.from?.last_name
    ? `${context.callbackQuery.from?.first_name} ${context.callbackQuery.from?.last_name}`
    : context.callbackQuery?.from?.first_name;

  return username ? `@${username}` : (fullName ?? '');
};

export class TestTensorListener {
  menu?: Menu<GrammyMenuContext>;

  messageNodeTimeouts: Record<string, NodeJS.Timeout> = {};

  messageNodeIntervals: Record<string, NodeJS.Timeout> = {};

  storage: Record<string, TestTensorStorage> = {};

  /**
   * @param {TensorService} tensorService
   */
  constructor(private tensorService: TensorService) {}

  writeDataset(state: 'negatives' | 'positives', word: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-unused-vars, sonarjs/no-dead-store
    const writeInFileFunction = () => {
      const fileName = `./${state}.json`;

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (!fs.existsSync(fileName)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.writeFileSync(fileName, '[]');
      }

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const file = JSON.parse(fs.readFileSync(fileName, 'utf8') || '[]') as string[];
      const newFile = [...new Set([...file, word])];

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.writeFileSync(fileName, `${JSON.stringify(newFile, null, 2)}\n`);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-unused-vars, sonarjs/no-dead-store
    const writeInRedisFunction = () => {
      switch (state) {
        case 'negatives': {
          return redisService.updateNegatives(word);
        }

        case 'positives': {
          return redisService.updatePositives(word);
        }

        default: {
          break;
        }
      }

      // eslint-disable-next-line unicorn/no-useless-undefined
      return undefined;
    };

    const writeInGoogleSheetFunction = () => {
      const sheetId = environmentConfig.GOOGLE_SPREADSHEET_ID;
      const sheetPositiveName = GOOGLE_SHEETS_NAMES.STRATEGIC_POSITIVE;
      const sheetNegativeName = GOOGLE_SHEETS_NAMES.STRATEGIC_NEGATIVE;

      switch (state) {
        case 'negatives': {
          return googleService.appendToSheet(sheetId, sheetNegativeName, word);
        }

        case 'positives': {
          return googleService.appendToSheet(sheetId, sheetPositiveName, word);
        }

        default: {
          break;
        }
      }

      // eslint-disable-next-line unicorn/no-useless-undefined
      return undefined;
    };

    switch (state) {
      case 'negatives':
      case 'positives': {
        // return writeInFileFunction();
        // return writeInRedisFunction();
        return writeInGoogleSheetFunction();
      }

      default: {
        break;
      }
    }

    // eslint-disable-next-line unicorn/no-useless-undefined
    return undefined;
  }

  /**
   * @param {Transformer} throttler - throttler need to be defined once to work.
   * So we can't init it each time in middleware because it has new instance, and it doesn't throttle,
   * */
  initMenu(throttler: Transformer): Menu<GrammyMenuContext> {
    /**
     * @param context
     * */
    // eslint-disable-next-line sonarjs/cognitive-complexity
    const finalMiddleware = async (context: GrammyContext) => {
      const storage = this.storage[this.getStorageKey(context)];

      clearTimeout(this.messageNodeTimeouts[this.getStorageKey(context)]);
      clearInterval(this.messageNodeIntervals[this.getStorageKey(context)]);

      delete this.messageNodeTimeouts[this.getStorageKey(context)];
      delete this.messageNodeIntervals[this.getStorageKey(context)];

      if (!storage) {
        context.editMessageText(context.msg?.text || '', { reply_markup: undefined }).catch(emptyFunction);

        return;
      }

      const positivesCount = storage.positives?.length || 0;
      const negativesCount = storage.negatives?.length || 0;
      const skipsCount = storage.skips?.length || 0;

      if (
        (positivesCount === negativesCount && positivesCount !== 0) ||
        (positivesCount === skipsCount && skipsCount !== 0) ||
        (negativesCount === skipsCount && negativesCount !== 0)
      ) {
        context.editMessageText(`${storage.originalMessage}\n\nЧекаю на більше оцінок...`).catch(emptyFunction);

        return;
      }

      let isPositive: boolean | null = null;

      if (positivesCount > negativesCount && positivesCount > skipsCount) {
        isPositive = true;
      } else if (negativesCount > positivesCount && negativesCount > skipsCount) {
        isPositive = false;
      }

      let winUsers: string[] | undefined;

      if (isPositive === true) {
        winUsers = storage.positives;
      } else if (isPositive === false) {
        winUsers = storage.negatives;
      } else {
        winUsers = storage.skips;
      }

      // const winUsersText = winUsers.slice(0, 2).join(', ') + (winUsers.length > 3 ? ' та інші' : '');

      const originMessage = context.update.callback_query?.message?.reply_to_message;

      if (!originMessage) {
        throw new Error('Cannot find origin message');
      }

      if (isPositive === true) {
        await this.writeDataset('positives', originMessage.text || originMessage.caption || '');
      } else if (isPositive === false) {
        await this.writeDataset('negatives', originMessage.text || originMessage.caption || '');
      }

      let text = '⏭ пропуск';

      if (isPositive === true) {
        text = '✅ спам';
      } else if (isPositive === false) {
        text = '⛔️ не спам';
      }

      /**
       * We need to use throttler for Test Tensor because telegram could ban the bot
       * */
      context.api.config.use(throttler);

      await context
        .editMessageText(
          `${storage.originalMessage}\n\n${
            winUsers?.join(', ') || ''
          } виділив/ли це як ${text}\nВидалю обидва повідомлення автоматично через ${removeTime} сек...\n${new Date().toISOString()}`,
          {
            parse_mode: 'HTML',
            reply_markup: undefined,
          },
        )
        .catch(emptyFunction);

      setTimeout(() => {
        context.api
          .deleteMessage(originMessage.chat.id, originMessage.message_id)
          .then(() => {
            if (context.chat?.id && context.msg?.message_id) {
              return context.api.deleteMessage(context.chat?.id, context.msg?.message_id);
            }

            // eslint-disable-next-line unicorn/no-useless-undefined
            return undefined;
          })
          .catch(console.error);
      }, removeTime * 1000);

      delete this.storage[this.getStorageKey(context)];
    };

    const processButtonMiddleware = wrapperErrorHandler((context) => {
      const storage = this.storage[this.getStorageKey(context)];

      context
        .editMessageText(`${storage.originalMessage}\n\nЧекаю ${storage.time} сек...\n${new Date().toISOString()}`, {
          parse_mode: 'HTML',
        })
        .catch(emptyFunction);

      clearTimeout(this.messageNodeTimeouts[this.getStorageKey(context)]);
      clearInterval(this.messageNodeIntervals[this.getStorageKey(context)]);
      storage.time = defaultTime;

      this.messageNodeIntervals[this.getStorageKey(context)] = setInterval(
        () => {
          storage.time -= 5;

          if (storage.time !== 0) {
            context
              .editMessageText(`${storage.originalMessage}\n\nЧекаю ${storage.time} сек...\n${new Date().toISOString()}`, {
                parse_mode: 'HTML',
              })
              .catch(emptyFunction);
          }
        },
        defaultTime * 1000 + 2000,
      );

      this.messageNodeTimeouts[this.getStorageKey(context)] = setTimeout(() => {
        finalMiddleware(context).catch(emptyFunction);
      }, defaultTime * 1000);
    });

    const initMenu = () => {
      this.menu = new Menu<GrammyMenuContext>('spam-menu')
        .text(
          (context) => `✅ Це спам (${this.storage[this.getStorageKey(context)]?.positives?.length || 0})`,
          (context) => context.menu.update(),
          wrapperErrorHandler<GrammyMenuContext>((context) => {
            this.initTensorSession(context, context.msg?.text || '');

            const storage = this.storage[this.getStorageKey(context)];
            const username = getAnyUsername(context);

            storage.negatives = storage.negatives?.filter((item) => item !== username);
            storage.skips = storage.skips?.filter((item) => item !== username);

            if (!storage.positives?.includes(username)) {
              storage.positives?.push(username);
            }

            context.menu.update();
            processButtonMiddleware(context, emptyPromiseFunction);
          }),
        )
        .text(
          (context) => `⛔️ Це не спам (${this.storage[this.getStorageKey(context)]?.negatives?.length || 0})`,
          wrapperErrorHandler((context) => {
            this.initTensorSession(context, context.msg?.text || '');

            const storage = this.storage[this.getStorageKey(context)];
            const username = getAnyUsername(context);

            storage.positives = storage.positives?.filter((item) => item !== username);
            storage.skips = storage.skips?.filter((item) => item !== username);

            if (!storage.negatives?.includes(username)) {
              storage.negatives?.push(username);
            }

            context.menu.update();
            processButtonMiddleware(context, emptyPromiseFunction);
          }),
        )
        .row()
        .text(
          (context) => `⏭ Пропустити (${this.storage[this.getStorageKey(context)]?.skips?.length || 0})`,
          wrapperErrorHandler((context) => {
            this.initTensorSession(context, context.msg?.text || '');

            const storage = this.storage[this.getStorageKey(context)];
            const username = getAnyUsername(context);

            storage.positives = storage.positives?.filter((item) => item !== username);
            storage.negatives = storage.negatives?.filter((item) => item !== username);

            if (!storage.skips?.includes(username)) {
              storage.skips?.push(username);
            }

            context.menu.update();
            processButtonMiddleware(context, emptyPromiseFunction);
          }),
        );

      return this.menu;
    };

    return initMenu();
  }

  /**
   * @param {GrammyContext} context
   * @param message
   * */
  initTensorSession(context: GrammyContext, message: string) {
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
   * @param {GrammyContext} context
   * */
  getStorageKey(context: GrammyContext) {
    let chatInstance: number | string | undefined;

    if (context.chat) {
      chatInstance = context.chat.id;
    } else if (context.callbackQuery) {
      chatInstance = context.callbackQuery?.chat_instance;
    } else {
      chatInstance = context.from?.id;
    }

    if (!chatInstance) {
      throw new Error('No chat instance!');
    }

    const messageId = context.msg?.reply_to_message?.message_id || context.msg?.message_id;

    if (!messageId) {
      throw new Error('No message id!');
    }

    return `${chatInstance}:${messageId}`;
  }

  /**
   * @param {Transformer} throttler - throttler need to be defined once to work.
   * So we can't init it each time in middleware because it has new instance, and it doesn't throttle,
   * */
  middleware(throttler: Transformer): GrammyMiddleware {
    /**
     * @param {GrammyContext} context
     * @param {Next} next
     * */
    return async (context) => {
      /**
       * We need to use throttler for Test Tensor because telegram could ban the bot
       * */
      context.api.config.use(throttler);

      // eslint-disable-next-line sonarjs/different-types-comparison
      if (context.from?.id !== creatorId) {
        if (context.chat?.type !== 'supergroup') {
          await context.reply('В особистих не працюю 😝');

          return;
        }

        if (context.chat.id !== trainingChat) {
          await context.reply('Я працюю тільки в одному супер чаті 😝');

          return;
        }
      }

      const message = context.state.text;

      if (!message && context.chat?.id && context.msg?.message_id) {
        await context.api.deleteMessage(context.chat?.id, context.msg?.message_id).catch();

        return;
      }

      try {
        const { spamRate, isSpam } = await this.tensorService.predict(message || '', null);

        const chance = `${(spamRate * 100).toFixed(4)}%`;
        const tensorTestMessage = getTensorTestResult({ chance, isSpam });

        this.initTensorSession(context, tensorTestMessage);

        context
          .reply(tensorTestMessage, {
            parse_mode: 'HTML',
            reply_to_message_id: context.msg?.message_id,
            reply_markup: this.menu,
          })
          .catch(emptyFunction);
      } catch (error) {
        console.error(error);

        if (error instanceof Error) {
          context
            .reply(`Cannot parse this message.\nError:\n${error.message}`, { reply_to_message_id: context.msg?.message_id })
            .catch(emptyFunction);
        }
      }
    };
  }
}
