import fs from 'node:fs';

import environment from '../config';

import { MessageUtil } from './message.util';
import { TelegramUtil } from './telegram.util';

export * from './error.util';
export * from './error-handler';
export * from './remove-duplicates.util';
export * from './reveal-hidden-urls.util';

const messageUtil = new MessageUtil();
const telegramUtil = new TelegramUtil();

export function joinMessage(messages) {
  return messages.join('\n');
}

/**
 * @param {GrammyContext} ctx
 * */
function logContext(context) {
  if (environment.DEBUG) {
    /**
     * @type {GrammyContext}
     * */
    const writeContext = JSON.parse(JSON.stringify(context));
    // noinspection JSConstantReassignment
    delete writeContext.tg;
    console.info(JSON.stringify(writeContext, null, 2));

    fs.writeFileSync('./last-ctx.json', `${JSON.stringify(writeContext, null, 2)}\n`);
  }
}

export function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export function truncateString(string_, number_) {
  if (string_.length > number_) {
    return `${string_.slice(0, number_)}..`;
  }

  return string_;
}

/**
 * @param {Date} date
 * */
export function formatDate(date) {
  return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'full', timeStyle: 'long', timeZone: 'Europe/Kiev' }).format(date);
}

/**
 * @param {Date} date
 * */
export function formatDateIntoAccusative(date) {
  return formatDate(date)
    .replace('середа', 'середу')
    .replace("п'ятниця", "п'ятницю")
    .replace('субота', 'суботу')
    .replace('неділя', 'неділю');
}

/**
 * @param {string} state
 * */
export function formatStateIntoAccusative(state) {
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
export function getUserData(context) {
  const username = context.from?.username;
  const fullName = context.from?.last_name ? `${context.from?.first_name} ${context.from?.last_name}` : context.from?.first_name;
  const writeUsername = username ? `@${username}` : fullName ?? '';
  const userId = context.from?.id;

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
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * @param {GrammyContext} ctx
 * @param {string} reason
 * @param {any} [extra]
 * */
export function logSkipMiddleware(context, reason, extra) {
  if (environment.DEBUG || environment.DEBUG_MIDDLEWARE) {
    console.info(`Skip due to ${reason} in chat ${context.chat.title}`, extra);
  }
}

/**
 * @param {Date} initialDate
 * @param {Date} compareDate
 * @param {number} hours
 * */
export function compareDatesWithOffset(initialDate, compareDate, hours) {
  const additionalTime = 1000 * 60 * 60 * hours;

  return +initialDate + additionalTime < +compareDate;
}

/**
 * @param {number} id
 * */
export function isIdWhitelisted(id) {
  const whitelist = (environment.USERS_WHITELIST || '').split(', ');
  return whitelist.includes(id.toString());
}
