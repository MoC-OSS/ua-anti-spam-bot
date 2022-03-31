const botActiveMiddlewareExports = require('./bot-active.middleware');
const globalMiddlewareExports = require('./global.middleware');
const onlyNotAdminMiddlewareExports = require('./only-not-admin.middleware');
const onlyNotForwardedMiddlewareExports = require('./only-not-forwarded.middleware');
const performanceMiddlewareExports = require('./performance.middleware');
const onlyWithText = require('./only-with-text.middleware');

module.exports = {
  ...botActiveMiddlewareExports,
  ...globalMiddlewareExports,
  ...onlyNotAdminMiddlewareExports,
  ...onlyNotForwardedMiddlewareExports,
  ...performanceMiddlewareExports,
  ...onlyWithText,
};
