// import { MessageUtil } from './message.util';
// import { TelegramUtil } from './telegram.util';
const { MessageUtil } = require('./message.util');
const { TelegramUtil } = require('./telegram.util');
const errorUtil = require('./error.util');

const messageUtil = new MessageUtil();
const telegramUtil = new TelegramUtil();

function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

function joinMessage(messages) {
  return messages.join('\n');
}

module.exports = {
  sleep,
  joinMessage,
  messageUtil,
  telegramUtil,
  ...errorUtil,
};
