const botActiveMiddlewareExports = require('./bot-active.middleware');
const globalMiddlewareExports = require('./global.middleware');
const onlyNotAdminMiddlewareExports = require('./only-not-admin.middleware');
const onlyNotForwardedMiddlewareExports = require('./only-not-forwarded.middleware');
const onlyWithText = require('./only-with-text.middleware');
const performanceEndMiddlewareExports = require('./performance-end.middleware');
const performanceStartMiddlewareExports = require('./performance-start.middleware');

module.exports = {
  ...botActiveMiddlewareExports,
  ...globalMiddlewareExports,
  ...onlyNotAdminMiddlewareExports,
  ...onlyNotForwardedMiddlewareExports,
  ...onlyWithText,
  ...performanceEndMiddlewareExports,
  ...performanceStartMiddlewareExports,
};
