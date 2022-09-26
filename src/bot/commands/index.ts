const commandSetterExports = require('./command-setter');
const helpMiddlewareExports = require('./help.middleware');
const swindlersUpdateMiddlewareExports = require('./swindlersUpdate.middleware');
const sessionMiddlewareExports = require('./session.middleware');
const startMiddlewareExports = require('./start.middleware');
const statisticsMiddlewareExports = require('./statistics.middleware');
const UpdatesMiddleware = require('./updates.middleware');
const SettingsMiddleware = require('./settings.middleware');

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
