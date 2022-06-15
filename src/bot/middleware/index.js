const botActiveMiddlewareExports = require('./bot-active.middleware');
const globalMiddlewareExports = require('./global.middleware');
const ignoreOldExports = require('./ignore-old.middleware');
const onlyCreator = require('./only-creator.middleware');
const onlyNotAdminMiddlewareExports = require('./only-not-admin.middleware');
const onlyNotForwardedMiddlewareExports = require('./only-not-forwarded.middleware');
const onlyWhenBotAdminExports = require('./only-when-bot-admin.middleware');
const onlyWithTextExports = require('./only-with-text.middleware');
const performanceEndMiddlewareExports = require('./performance-end.middleware');
const performanceStartMiddlewareExports = require('./performance-start.middleware');
const onlyAdmin = require('./only-admin.middleware');

module.exports = {
  ...onlyAdmin,
  ...botActiveMiddlewareExports,
  ...globalMiddlewareExports,
  ...ignoreOldExports,
  ...onlyCreator,
  ...onlyNotAdminMiddlewareExports,
  ...onlyNotForwardedMiddlewareExports,
  ...onlyWhenBotAdminExports,
  ...onlyWithTextExports,
  ...performanceEndMiddlewareExports,
  ...performanceStartMiddlewareExports,
};
