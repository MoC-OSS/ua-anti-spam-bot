// import { MessageUtil } from './message.util';
// import { TelegramUtil } from './telegram.util';
const { MessageUtil } = require('./message.util');
const { TelegramUtil } = require('./telegram.util');
const errorUtil = require('./error.util');

const messageUtil = new MessageUtil();
const telegramUtil = new TelegramUtil();

module.exports = {
  messageUtil,
  telegramUtil,
  ...errorUtil,
};
