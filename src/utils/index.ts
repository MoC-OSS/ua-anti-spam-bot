import fs from 'node:fs';

import { environmentConfig } from '../config';
import type { GrammyContext, RealGrammyContext } from '../types';

import { MessageUtil } from './message.util';
import { TelegramUtil } from './telegram.util';

export * from './error.util';
export * from './error-handler';
export * from './remove-duplicates.util';
export * from './reveal-hidden-urls.util';

export const messageUtil = new MessageUtil();
export const telegramUtil = new TelegramUtil();

/**
 * Temporary fix for catch error handling
 * TODO rework with global grammy error handling
 * */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const emptyFunction = () => {};

/**
 * @param {GrammyContext} context
 * */
export function logContext(context: GrammyContext) {
  if (environmentConfig.DEBUG) {
    /**
     * @type {GrammyContext}
     * */
    const writeContext = JSON.parse(JSON.stringify(context)) as RealGrammyContext;
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

export function truncateString(string_: string, number_: number) {
  if (string_.length > number_) {
    return `${string_.slice(0, number_)}..`;
  }

  return string_;
}

/**
 * @param {Date} date
 * */
export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'full', timeStyle: 'long', timeZone: 'Europe/Kiev' }).format(date);
}

/**
 * @param {Date} date
 * */
export function formatDateIntoAccusative(date: Date) {
  return formatDate(date)
    .replace('середа', 'середу')
    .replace("п'ятниця", "п'ятницю")
    .replace('субота', 'суботу')
    .replace('неділя', 'неділю');
}

/**
 * @param {string} state
 * */
export function formatStateIntoAccusative(state: string) {
  if (!state.includes('область')) {
    return state;
  }

  const [stateName] = state.split(' ');
  const accusativeStateName = stateName.replace('ька', 'ькій');
  const accusativeStateType = 'області';

  return `${accusativeStateName} ${accusativeStateType}`;
}

/**
 * @param {GrammyContext} context
 * */
export function getUserData(context: GrammyContext) {
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
 * @param {GrammyContext} context
 * @param {string} reason
 * @param {any} [extra]
 * */
export function logSkipMiddleware(context: GrammyContext, reason: string, extra?: any) {
  if (environmentConfig.DEBUG || environmentConfig.DEBUG_MIDDLEWARE) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.info(`Skip due to ${reason} in chat ${context.chat?.title || '$empty_title'}`, extra);
  }
}

/**
 * @param {Date} initialDate
 * @param {Date} compareDate
 * @param {number} hours
 * */
export function compareDatesWithOffset(initialDate: Date, compareDate: Date, hours: number) {
  const additionalTime = 1000 * 60 * 60 * hours;

  return +initialDate + additionalTime < +compareDate;
}

/**
 * @param {number} id
 * */
export function isIdWhitelisted(id: number | undefined) {
  if (!id) {
    throw new Error(`This is an invalid id`);
  }
  const whitelist = (environmentConfig.USERS_WHITELIST || '').split(', ');
  return whitelist.includes(id.toString());
}
