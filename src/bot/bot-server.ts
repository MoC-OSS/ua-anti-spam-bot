/**
 * @module bot-express.server
 * @description Express HTTP server that exposes a REST API alongside the Telegram bot.
 * Provides health-check, statistics, and administrative endpoints via {@link apiRouter}.
 */

import type { Bot } from 'grammy';

import cors from 'cors';
import express from 'express';

import { apiRouter } from '@server/api.router';

import { environmentConfig } from '@shared/config';

import type { GrammyContext } from '@app-types/context';

import { logger } from '@utils/logger.util';

export const runBotExpressServer = (bot: Bot<GrammyContext>) => {
  const app = express();

  app.use(express.json());
  app.use(cors({ origin: environmentConfig.FRONTEND_HOST }));
  app.use('/api', apiRouter(bot));

  app.get('/health-check', (request, response) => response.json({ status: 'ok' }));

  app.listen(environmentConfig.BOT_PORT, environmentConfig.BOT_HOST, () => {
    logger.info(`Bot-server started on https://${environmentConfig.BOT_HOST}:${environmentConfig.BOT_PORT}`);
  });

  return app;
};
