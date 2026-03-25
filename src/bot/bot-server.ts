/**
 * @module bot-express.server
 * @description Express HTTP server that exposes a REST API alongside the Telegram bot.
 * Provides health-check, statistics, and administrative endpoints via {@link apiRouter}.
 *
 * The server starts in two phases:
 * 1. {@link startHealthCheckServer} — Starts immediately with only the `/health-check` endpoint so
 *    that ALB / ECS health probes succeed while TF.js models are still loading.
 * 2. {@link attachBotApiRoutes} — Called after the bot is fully initialized to wire up the
 *    authenticated `/api` routes that depend on the bot instance.
 */

import type { Bot } from 'grammy';

import cors from 'cors';
import express, { type Express } from 'express';

import { apiRouter } from '@server/api.router';

import { environmentConfig } from '@shared/config';

import type { GrammyContext } from '@app-types/context';

import { logger } from '@utils/logger.util';

/**
 * Starts a minimal Express server with only the `/health-check` endpoint.
 * Call this as early as possible so ALB health probes pass during model loading.
 * @returns The Express application instance (to be extended later via {@link attachBotApiRoutes}).
 */
export const startHealthCheckServer = (): Express => {
  const app = express();

  app.get('/health-check', (request, response) => response.json({ status: 'ok' }));

  app.listen(environmentConfig.BOT_PORT, environmentConfig.BOT_HOST, () => {
    logger.info(`Health-check server started on https://${environmentConfig.BOT_HOST}:${environmentConfig.BOT_PORT}`);
  });

  return app;
};

/**
 * Attaches the full API router and middleware to an existing Express app after the bot is ready.
 * @param app - The Express application returned by {@link startHealthCheckServer}.
 * @param bot - The fully initialized Grammy bot instance.
 */
export const attachBotApiRoutes = (app: Express, bot: Bot<GrammyContext>): void => {
  app.use(express.json());
  app.use(cors({ origin: environmentConfig.FRONTEND_HOST }));
  app.use('/api', apiRouter(bot));

  logger.info('Bot API routes attached to health-check server.');
};
