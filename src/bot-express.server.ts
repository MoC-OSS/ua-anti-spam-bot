import cors from 'cors';
import express from 'express';
import type { Bot } from 'grammy';

import { apiRouter } from './express-logic/api.router';
import { environmentConfig } from './config';
import type { GrammyContext } from './types';

export const runBotExpressServer = (bot: Bot<GrammyContext>) => {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: environmentConfig.FRONTEND_HOST }));
  app.use('/', apiRouter(bot));

  app.get('/health-check', (request, response) => response.json({ status: 'ok' }));

  app.listen(environmentConfig.BOT_PORT, environmentConfig.BOT_HOST, () => {
    console.info(`Bot-server started on https://${environmentConfig.BOT_HOST}:${environmentConfig.BOT_PORT}`);
  });

  return app;
};
