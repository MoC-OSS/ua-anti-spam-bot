const UpdatesInputMiddleware = require('./updatesInput.middleware');
const UpdatesConfirmationMiddleware = require('./updatesConfirmation.middleware');

module.exports = {
  ...UpdatesInputMiddleware,
  ...UpdatesConfirmationMiddleware,
};
