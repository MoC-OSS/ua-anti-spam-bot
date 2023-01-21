import { run } from '@grammyjs/runner';
import * as tf from '@tensorflow/tfjs-node';
import { Bot } from 'grammy';
import ms from 'ms';

import { getBot } from './bot';
import { runBotExpressServer } from './bot-express.server';
import { environmentConfig } from './config';
import { logsChat } from './creator';
import { alarmService } from './services';
import type { GrammyContext } from './types';
import { sleep } from './utils';

(async () => {
  /**
   * Tensorflow.js offers two flags, enableProdMode and enableDebugMode.
   * If you're going to use any TF model in production, be sure to enable prod mode before loading models.
   * */
  if (environmentConfig.ENV === 'production') {
    tf.enableProdMode();
  }

  console.info('Waiting for the old instance to down...');
  await sleep(environmentConfig.ENV === 'local' ? 0 : ms('5s'));
  console.info('Starting a new instance...');

  const initialBot = new Bot<GrammyContext>(environmentConfig?.BOT_TOKEN);
  const bot = await getBot(initialBot);

  runBotExpressServer();

  const runner = run(bot, 500, {
    allowed_updates: [
      'chat_member',
      'edited_message',
      'channel_post',
      'edited_channel_post',
      'inline_query',
      'chosen_inline_result',
      'callback_query',
      'shipping_query',
      'pre_checkout_query',
      'poll',
      'poll_answer',
      'my_chat_member',
      'chat_member',
      'chat_join_request',
      'message',
    ],
  });

  /**
   * Check when the bot is run
   * */
  if (!bot.isInited()) {
    await bot.init();
  }

  console.info(`Bot @${bot.botInfo.username} started!`, new Date().toString());

  if (environmentConfig.ENV !== 'local') {
    bot.api
      .sendMessage(logsChat, `🎉 <b>Bot @${bot.botInfo.username} has been started!</b>\n<i>${new Date().toString()}</i>`, {
        parse_mode: 'HTML',
      })
      .catch(() => {
        console.error('This bot is not authorized in this LOGS chat!');
      });

    /**
     * Enable alarm service only after bot is started
     * */
    alarmService.updatesEmitter.on('connect', (reason) => {
      bot.api.sendMessage(logsChat, `🎉 Air Raid Alarm API has been started by ${reason} reason!`).catch(() => {
        console.error('This bot is not authorized in this LOGS chat!');
      });
    });

    alarmService.updatesEmitter.on('close', (reason) => {
      bot.api.sendMessage(logsChat, `⛔️ Air Raid Alarm API has been stopped by ${reason} reason!`).catch(() => {
        console.error('This bot is not authorized in this LOGS chat!');
      });
    });
  }

  alarmService.enable('bot_start');

  // Enable graceful stop
  const stopRunner = () => runner.isRunning() && runner.stop();
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  process.once('SIGINT', stopRunner);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  process.once('SIGTERM', stopRunner);

  // setTimeout(() => {
  //   bot.handleUpdate({
  //     update_id: 324_610_464,
  //     message: {
  //       message_id: 12_247,
  //       from: {
  //         id: 341_977_297,
  //         is_bot: false,
  //         first_name: 'Dmytro',
  //         last_name: 'Vakulenko',
  //         username: 'dimkasmile',
  //         language_code: 'en',
  //         is_premium: true,
  //       },
  //       chat: {
  //         id: 341_977_297,
  //         first_name: 'Dmytro',
  //         last_name: 'Vakulenko',
  //         username: 'dimkasmile',
  //         type: 'private',
  //       },
  //       date: 1_674_320_742,
  //       sticker: {
  //         width: 512,
  //         height: 512,
  //         emoji: '😮',
  //         set_name: 'f_r6nmde3_5398674526_by_fStikBot',
  //         is_animated: false,
  //         is_video: true,
  //         type: 'regular',
  //         thumb: {
  //           file_id: 'AAMCAgADGQEAAi_XY8wbZm-BbZrt54WmiqdngCejP8oAAnoZAALyyKFLA3IZkPHXwqQBAAdtAAMtBA',
  //           file_unique_id: 'AQADehkAAvLIoUty',
  //           file_size: 10_860,
  //           width: 320,
  //           height: 320,
  //         },
  //         file_id: 'CAACAgIAAxkBAAIv12PMG2ZvgW2a7eeFpoqnZ4Anoz_KAAJ6GQAC8sihSwNyGZDx18KkLQQ',
  //         file_unique_id: 'AgADehkAAvLIoUs',
  //         file_size: 32_504,
  //       },
  //     },
  //   });
  // }, 1000);
})().catch((error) => {
  console.error('FATAL: Bot crashed with error:', error);
  throw error;
});
