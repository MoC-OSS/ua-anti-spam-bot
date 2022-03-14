const botActiveMiddlewareExports = require('./bot-active.middleware');
const globalMiddlewareExports = require('./global.middleware');
const performanceMiddlewareExports = require('./performance.middleware');

module.exports = {
  ...botActiveMiddlewareExports,
  ...globalMiddlewareExports,
  ...performanceMiddlewareExports,
};
