/**
 * @module index
 * @description Application entry point. Initializes TensorFlow in production mode,
 * creates the bot instance, starts the grammyjs runner, and launches the Express health server.
 */

import { run } from '@grammyjs/runner';
import { Bot } from 'grammy';

import ms from 'ms';

import { environmentConfig } from '@shared/config';

import * as tf from '@tensorflow/tfjs-node';

import type { GrammyContext } from '@app-types/context';

import { sleep } from '@utils/generic.util';
import { logger } from '@utils/logger.util';

import { version } from '../../package.json';

import { getBot } from './bot';
import { attachBotApiRoutes, startHealthCheckServer } from './bot-server';
import { logsChat } from './creator';

(async () => {
  /**
   * Tensorflow.js offers two flags, enableProdMode and enableDebugMode.
   * If you're going to use any TF model in production, be sure to enable prod mode before loading models.
   */
  if (environmentConfig.ENV === 'production') {
    tf.enableProdMode();
  }

  // Start health-check server immediately so ALB probes pass during model loading.
  const healthApp = startHealthCheckServer();

  logger.info('Waiting for the old instance to down...');
  await sleep(environmentConfig.ENV === 'local' ? 0 : ms('5s'));
  logger.info('Starting a new instance...');

  const initialBot = new Bot<GrammyContext>(environmentConfig?.BOT_TOKEN);
  const bot = await getBot(initialBot);

  attachBotApiRoutes(healthApp, bot);

  const runner = run(bot, {
    runner: {
      fetch: {
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
      },
    },
  });

  /**
   * Check when the bot is run
   */
  if (!bot.isInited()) {
    await bot.init();
  }

  logger.info(`Bot @${bot.botInfo.username} started! ${new Date().toString()}`);

  if (environmentConfig.ENV !== 'local') {
    bot.api
      .sendMessage(logsChat, `🎉 <b>Bot @${bot.botInfo.username} has been started!</b> v${version}\n<i>${new Date().toString()}</i>`, {
        parse_mode: 'HTML',
      })
      .catch(() => {
        logger.error('This bot is not authorized in this LOGS chat!');
      });
  }

  // Enable graceful stop
  const stopRunner = () => runner.isRunning() && runner.stop();

  const newMemoryUsage = process.memoryUsage();

  logger.info(`Memory Usage: ${newMemoryUsage.rss / 1024 / 1024} MB`);

  process.once('SIGINT', stopRunner);

  process.once('SIGTERM', stopRunner);
})().catch((error) => {
  logger.error('FATAL: Bot crashed with error:', error);
  throw error;
});
