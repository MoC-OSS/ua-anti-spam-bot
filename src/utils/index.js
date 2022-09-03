const fs = require('fs');

const { env } = require('typed-dotenv').config();

const { MessageUtil } = require('./message.util');
const { TelegramUtil } = require('./telegram.util');
const errorUtilExports = require('./error.util');
const errorHandlerExports = require('./error-handler');
const revealHiddenUrlsExports = require('./reveal-hidden-urls.util');

const messageUtil = new MessageUtil();
const telegramUtil = new TelegramUtil();

function joinMessage(messages) {
  return messages.join('\n');
}

/**
 * @param {GrammyContext} ctx
 * */
function logCtx(ctx) {
  if (env.DEBUG) {
    /**
     * @type {GrammyContext}
     * */
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

/**
 * @param {Date} date
 * */
function formatDateIntoAccusative(date) {
  return formatDate(date)
    .replace('середа', 'середу')
    .replace("п'ятниця", "п'ятницю")
    .replace('субота', 'суботу')
    .replace('неділя', 'неділю');
}

/**
 * @param {string} state
 * */
function formatStateIntoAccusative(state) {
  if (!state.includes('область')) {
    return state;
  }

  const [stateName] = state.split(' ');
  const accusativeStateName = stateName.replace('ька', 'ькій');
  const accusativeStateType = 'області';

  return `${accusativeStateName} ${accusativeStateType}`;
}

/**
 * @param {GrammyContext} ctx
 * */
function getUserData(ctx) {
  const username = ctx.from?.username;
  const fullName = ctx.from?.last_name ? `${ctx.from?.first_name} ${ctx.from?.last_name}` : ctx.from?.first_name;
  const writeUsername = username ? `@${username}` : fullName ?? '';
  const userId = ctx.from?.id;

  return {
    username,
    fullName,
    writeUsername,
    userId,
  };
}

/**
 * @template T
 *
 * @param {T[]} array
 * @returns {T} - random item from array
 * */
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * @param {GrammyContext} ctx
 * @param {string} reason
 * @param {any} [extra]
 * */
function logSkipMiddleware(ctx, reason, extra) {
  if (env.DEBUG || env.DEBUG_MIDDLEWARE) {
    console.info(`Skip due to ${reason} in chat ${ctx.chat.title}`, extra);
  }
}

/**
 * @param {Date} initialDate
 * @param {Date} compareDate
 * @param {number} hours
 * */
function compareDatesWithOffset(initialDate, compareDate, hours) {
  const additionalTime = 1000 * 60 * 60 * hours;

  return +initialDate + additionalTime < +compareDate;
}

/**
 * @param {number} id
 * */
function isIdWhitelisted(id) {
  const whitelist = (env.USERS_WHITELIST || '').split(', ');
  return whitelist.includes(id.toString());
}

module.exports = {
  logSkipMiddleware,
  getUserData,
  joinMessage,
  logCtx,
  sleep,
  compareDatesWithOffset,
  truncateString,
  formatDate,
  formatDateIntoAccusative,
  formatStateIntoAccusative,
  getRandomItem,
  messageUtil,
  telegramUtil,
  isIdWhitelisted,
  ...errorHandlerExports,
  ...errorUtilExports,
  ...revealHiddenUrlsExports,
};
