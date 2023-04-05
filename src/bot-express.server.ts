import cors from 'cors';
import express from 'express';

import { environmentConfig } from './config';
import { verifyTelegramWebAppData } from './express-logic';

export const runBotExpressServer = () => {
  const app = express();

  app.use(express.json());

  // TODO setup origin
  app.use(cors({ origin: 'https://*.ngrok.io' }));

  app.post('/validate', (request, response) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
    const isValid = verifyTelegramWebAppData(request.body.query);

    response.json({ isValid });
  });

  app.get('/health-check', (request, response) => response.json({ status: 'ok' }));

  app.listen(environmentConfig.BOT_PORT, environmentConfig.BOT_HOST, () => {
    console.info(`Bot-server started on http://${environmentConfig.BOT_HOST}:${environmentConfig.BOT_PORT}`);
  });

  return app;
};
