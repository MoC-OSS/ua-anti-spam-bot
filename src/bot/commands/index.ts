import commandSetterExports from './command-setter';
import helpMiddlewareExports from './help.middleware';
import swindlersUpdateMiddlewareExports from './swindlersUpdate.middleware';
import sessionMiddlewareExports from './session.middleware';
import startMiddlewareExports from './start.middleware';
import statisticsMiddlewareExports from './statistics.middleware';
import UpdatesMiddleware from './updates.middleware';
import SettingsMiddleware from './settings.middleware';

module.exports = {
  ...commandSetterExports,
  ...helpMiddlewareExports,
  ...sessionMiddlewareExports,
  ...startMiddlewareExports,
  ...statisticsMiddlewareExports,

  ...UpdatesMiddleware,
  ...SettingsMiddleware,
  ...swindlersUpdateMiddlewareExports,
};
