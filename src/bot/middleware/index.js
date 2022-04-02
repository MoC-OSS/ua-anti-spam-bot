const botActiveMiddlewareExports = require('./bot-active.middleware');
const globalMiddlewareExports = require('./global.middleware');
const onlyNotAdminMiddlewareExports = require('./only-not-admin.middleware');
const onlyNotForwardedMiddlewareExports = require('./only-not-forwarded.middleware');
const onlyWhenBotAdminExports = require('./only-when-bot-admin.middleware');
const onlyWithTextExports = require('./only-with-text.middleware');
const performanceEndMiddlewareExports = require('./performance-end.middleware');
const performanceStartMiddlewareExports = require('./performance-start.middleware');

module.exports = {
  ...botActiveMiddlewareExports,
  ...globalMiddlewareExports,
  ...onlyNotAdminMiddlewareExports,
  ...onlyNotForwardedMiddlewareExports,
  ...onlyWhenBotAdminExports,
  ...onlyWithTextExports,
  ...performanceEndMiddlewareExports,
  ...performanceStartMiddlewareExports,
};
