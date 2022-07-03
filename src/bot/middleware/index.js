const botActiveMiddlewareExports = require('./bot-active.middleware');
const deleteMessageMiddlewareExports = require('./delete-message.middleware');
const deleteSwindlersMiddlewareExports = require('./delete-swindlers.middleware');
const globalMiddlewareExports = require('./global.middleware');
const ignoreBySettingsMiddlewareExports = require('./ignore-by-settings.middleware');
const ignoreOldExports = require('./ignore-old.middleware');
const onlyAdmin = require('./only-admin.middleware');
const onlyCreator = require('./only-creator.middleware');
const onlyNotAdminMiddlewareExports = require('./only-not-admin.middleware');
const onlyNotForwardedMiddlewareExports = require('./only-not-forwarded.middleware');
const onlyWhenBotAdminExports = require('./only-when-bot-admin.middleware');
const onlyWithTextExports = require('./only-with-text.middleware');
const performanceEndMiddlewareExports = require('./performance-end.middleware');
const performanceStartMiddlewareExports = require('./performance-start.middleware');

module.exports = {
  ...botActiveMiddlewareExports,
  ...deleteMessageMiddlewareExports,
  ...deleteSwindlersMiddlewareExports,
  ...globalMiddlewareExports,
  ...ignoreBySettingsMiddlewareExports,
  ...ignoreOldExports,
  ...onlyAdmin,
  ...onlyCreator,
  ...onlyNotAdminMiddlewareExports,
  ...onlyNotForwardedMiddlewareExports,
  ...onlyWhenBotAdminExports,
  ...onlyWithTextExports,
  ...performanceEndMiddlewareExports,
  ...performanceStartMiddlewareExports,
};
