import type { ErrorHandler, MiddlewareFn } from 'grammy';
import { GrammyError, HttpError, InputFile } from 'grammy';

import { environmentConfig } from '../config';
import { logsChat } from '../creator';
import type { GrammyContext, RealGrammyContext } from '../types';

import { emptyFunction } from './empty-functions.util';

/**
 * Handle single error with expected reason
 * */
export const handleError = (catchError: unknown, reason = '') => {
  console.error('**** REASON-HANDLED ERROR ****', reason || '$NO_REASON', catchError);
};

/**
 * Global error handler for the bot
 * */
export const globalErrorHandler: ErrorHandler<GrammyContext> = (botError) => {
  const { ctx, error } = botError;
  console.error(`Error while handling update ${ctx.update.update_id}:`);

  if (error instanceof GrammyError) {
    console.error('**** GLOBAL-HANDLED ERROR **** Error in request:', error.description);
  } else if (error instanceof HttpError) {
    console.error('**** GLOBAL-HANDLED ERROR **** Could not contact Telegram:', error);
  } else {
    console.error('**** GLOBAL-HANDLED ERROR **** Unknown error:', error);
  }

  const writeContext = JSON.parse(JSON.stringify(ctx)) as RealGrammyContext;
  // noinspection JSConstantReassignment
  delete writeContext.tg;
  delete writeContext.telegram;
  // noinspection JSConstantReassignment
  delete writeContext.api;

  if (writeContext.state.photo?.file) {
    writeContext.state.photo.file = Buffer.from([]);
  }

  console.error('*** GLOBAL-HANDLED ERROR CTX ***', writeContext);

  if (environmentConfig.DEBUG) {
    // eslint-disable-next-line no-console
    console.trace('*** GLOBAL-HANDLED ERROR TRACE ***');
  }
};

/**
 * Wrapper to catch async errors within a stage. Helps to avoid try catch blocks in there
 * @param {function} callback - function to enter a stage
 */
export const wrapperErrorHandler =
  <C extends GrammyContext = GrammyContext>(callback: MiddlewareFn<C>): MiddlewareFn<C> =>
  async (context, next) => {
    try {
      if (!callback) {
        console.error('wrapperErrorHandler received an empty value instead of function.');
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

      if (writeContext.state.photo?.file) {
        writeContext.state.photo.file = Buffer.from([]);
      }

      console.error('*** FUNCTION-HANDLED ERROR CTX ***', writeContext);

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
