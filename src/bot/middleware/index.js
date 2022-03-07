const globalMiddlewareExports = require('./global.middleware');
const performanceMiddlewareExports = require('./performance.middleware');

module.exports = {
  ...globalMiddlewareExports,
  ...performanceMiddlewareExports,
};
