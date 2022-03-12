const helpMiddlewareExports = require('./help.middleware');
const sessionMiddlewareExports = require('./session.middleware');
const startMiddlewareExports = require('./start.middleware');
const settingsMiddlewareExports = require('./settings.middleware');
const statisticsMiddlewareExports = require('./statistics.middleware');

module.exports = {
  ...helpMiddlewareExports,
  ...sessionMiddlewareExports,
  ...startMiddlewareExports,
  ...settingsMiddlewareExports,
  ...statisticsMiddlewareExports,
};
