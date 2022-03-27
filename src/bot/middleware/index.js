const botActiveMiddlewareExports = require('./bot-active.middleware');
const globalMiddlewareExports = require('./global.middleware');
const onlyNotAdminMiddlewareExports = require('./only-not-admin.middleware');
const performanceMiddlewareExports = require('./performance.middleware');

module.exports = {
  ...botActiveMiddlewareExports,
  ...globalMiddlewareExports,
  ...onlyNotAdminMiddlewareExports,
  ...performanceMiddlewareExports,
};
