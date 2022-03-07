const fs = require('fs');

const { env } = require('typed-dotenv').config();

const { MessageUtil } = require('./message.util');
const { TelegramUtil } = require('./telegram.util');
const errorUtil = require('./error.util');

const messageUtil = new MessageUtil();
const telegramUtil = new TelegramUtil();

function joinMessage(messages) {
  return messages.join('\n');
}

function logCtx(ctx) {
  if (env.DEBUG) {
    const writeCtx = JSON.parse(JSON.stringify(ctx));
    // noinspection JSConstantReassignment
    delete writeCtx.tg;
    console.info(JSON.stringify(writeCtx, null, 2));

    fs.writeFileSync('./last-ctx.json', `${JSON.stringify(writeCtx, null, 2)}\n`);
  }
}

function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

function truncateString(str, num) {
  if (str.length > num) {
    return `${str.slice(0, num)}..`;
  }

  return str;
}

/**
 * @param {Date} date
 * */
function formatDate(date) {
  return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'full', timeStyle: 'long', timeZone: 'Europe/Kiev' }).format(date);
}

module.exports = {
  joinMessage,
  logCtx,
  sleep,
  truncateString,
  formatDate,
  messageUtil,
  telegramUtil,
  ...errorUtil,
};
