import type { Middleware, MiddlewareFn } from 'grammy';
import { InputFile } from 'grammy';

import { environmentConfig } from '../config';
import { logsChat } from '../creator';
import type { GrammyContext, RealGrammyContext } from '../types';

import { handleError } from './error.util';

/**
 * Wrapper to catch async errors within a stage. Helps to avoid try catch blocks in there
 * @param {function} callback - function to enter a stage
 */
export const errorHandler =
  (callback: MiddlewareFn<GrammyContext>): Middleware<GrammyContext> =>
  async (context, next) => {
    try {
      if (!callback) {
        console.error('errorHandler received an empty value instead of function.');
      }

      return await callback(context, next);
    } catch (error) {
      handleError(error);

      const writeContext = JSON.parse(JSON.stringify(context)) as RealGrammyContext;
      // noinspection JSConstantReassignment
      delete writeContext.tg;
      delete writeContext.telegram;
      // noinspection JSConstantReassignment
      delete writeContext.api;

      console.error('*** CTX ***', writeContext);

      if (!environmentConfig.DEBUG && error instanceof Error) {
        context.api
          .sendMessage(
            logsChat,
            ['<b>Bot failed with message:</b>', error.message, '', '<b>Stack:</b>', `<code>${error.stack || ''}</code>`].join('\n'),
            {
              parse_mode: 'HTML',
            },
          )
          .then(() =>
            context.api
              .sendDocument(
                logsChat,
                new InputFile(Buffer.from(JSON.stringify(writeContext, null, 2)), `ctx-${new Date().toISOString()}.json`),
              )
              .catch(handleError),
          )
          .catch(handleError);
      }

      return next();
    }
  };
