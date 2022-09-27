import botActiveMiddlewareExports from './bot-active.middleware';
import deleteMessageMiddlewareExports from './delete-message.middleware';
import deleteSwindlersMiddlewareExports from './delete-swindlers.middleware';
import globalMiddlewareExports from './global.middleware';
import ignoreBySettingsMiddlewareExports from './ignore-by-settings.middleware';
import ignoreOldExports from './ignore-old.middleware';
import nestedMiddlewareExports from './nested.middleware';
import onlyAdmin from './only-admin.middleware';
import onlyCreator from './only-creator.middleware';
import onlyWhitelisted from './only-whitelisted';
import onlyNotAdminMiddlewareExports from './only-not-admin.middleware';
import onlyNotForwardedMiddlewareExports from './only-not-forwarded.middleware';
import onlyWhenBotAdminExports from './only-when-bot-admin.middleware';
import onlyWithTextExports from './only-with-text.middleware';
import performanceEndMiddlewareExports from './performance-end.middleware';
import performanceStartMiddlewareExports from './performance-start.middleware';

module.exports = {
  ...botActiveMiddlewareExports,
  ...deleteMessageMiddlewareExports,
  ...deleteSwindlersMiddlewareExports,
  ...globalMiddlewareExports,
  ...ignoreBySettingsMiddlewareExports,
  ...ignoreOldExports,
  ...nestedMiddlewareExports,
  ...onlyAdmin,
  ...onlyCreator,
  ...onlyWhitelisted,
  ...onlyNotAdminMiddlewareExports,
  ...onlyNotForwardedMiddlewareExports,
  ...onlyWhenBotAdminExports,
  ...onlyWithTextExports,
  ...performanceEndMiddlewareExports,
  ...performanceStartMiddlewareExports,
};
