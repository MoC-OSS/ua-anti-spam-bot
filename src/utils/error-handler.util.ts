import type { ErrorHandler, MiddlewareFn } from 'grammy';
import { GrammyError, HttpError, InputFile } from 'grammy';

import type { GrammyContext } from '@app-types/context';

import { environmentConfig } from '../config';
import { logsChat } from '../creator';

import { emptyFunction } from './empty-functions.util';
import { logger } from './logger.util';
import { optimizeWriteContextUtility } from './optimize-write-context.util';

/**
 * Handle single error with expected reason
 * */
export const handleError = (catchError: unknown, reason = '') => {
  logger.error({ reason: reason || '$NO_REASON', err: catchError }, '**** REASON-HANDLED ERROR ****');
};

/**
 * Global error handler for the bot
 * */
export const globalErrorHandler: ErrorHandler<GrammyContext> = (botError) => {
  const { ctx, error } = botError;

  logger.error(`Error while handling update ${ctx.update.update_id}:`);

  if (error instanceof GrammyError) {
    logger.error({ description: error.description }, '**** GLOBAL-HANDLED ERROR **** Error in request:');
  } else if (error instanceof HttpError) {
    logger.error({ err: error }, '**** GLOBAL-HANDLED ERROR **** Could not contact Telegram:');
  } else {
    logger.error({ err: error }, '**** GLOBAL-HANDLED ERROR **** Unknown error:');
  }

  const writeContext = optimizeWriteContextUtility(ctx);

  logger.error({ writeContext }, '*** GLOBAL-HANDLED ERROR CTX ***');

  if (environmentConfig.DEBUG) {
    logger.trace('*** GLOBAL-HANDLED ERROR TRACE ***');
  }
};

/**
 * Wrapper to catch async errors within a stage. Helps to avoid try catch blocks in there
 * @param {function} callback - function to enter a stage
 */
export const wrapperErrorHandler =
  <TContext extends GrammyContext = GrammyContext>(callback: MiddlewareFn<TContext>): MiddlewareFn<TContext> =>
  async (context, next) => {
    try {
      if (!callback) {
        logger.error('wrapperErrorHandler received an empty value instead of function.');
      }

      return await callback(context, next);
    } catch (error) {
      handleError(error);

      const writeContext = optimizeWriteContextUtility(context);

      logger.error({ writeContext }, '*** FUNCTION-HANDLED ERROR CTX ***');

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

      return next().catch(emptyFunction);
    }
  };
