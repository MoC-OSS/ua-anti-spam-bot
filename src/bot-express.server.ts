import type { Bot } from 'grammy';

import cors from 'cors';
import express from 'express';

import { apiRouter } from './express-logic/api.router';
import type { GrammyContext } from './types/context';
import { environmentConfig } from './config';

export const runBotExpressServer = (bot: Bot<GrammyContext>) => {
  const app = express();

  app.use(express.json());
  app.use(cors({ origin: environmentConfig.FRONTEND_HOST }));
  app.use('/api', apiRouter(bot));

  app.get('/health-check', (request, response) => response.json({ status: 'ok' }));

  app.listen(environmentConfig.BOT_PORT, environmentConfig.BOT_HOST, () => {
    console.info(`Bot-server started on https://${environmentConfig.BOT_HOST}:${environmentConfig.BOT_PORT}`);
  });

  return app;
};
