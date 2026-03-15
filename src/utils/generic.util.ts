/**
 * @module generic.util
 * @description General-purpose utility functions for context logging, user data extraction,
 * string manipulation, feature settings, and whitelist checks.
 */

import fs from 'node:fs';

import type { GrammyContext } from '@app-types/context';
import type { ChatSettings } from '@app-types/session';

import { environmentConfig } from '../config';

import { logger } from './logger.util';
import { optimizeWriteContextUtility } from './optimize-write-context.util';

/**
 * Logs the current context to the console and a file when debug mode is enabled.
 *
 * @param {GrammyContext} context
 * */
export function logContext(context: GrammyContext) {
  if (environmentConfig.DEBUG) {
    const writeContext = optimizeWriteContextUtility(context);

    logger.info(JSON.stringify(writeContext, null, 2));

    fs.writeFileSync('./last-ctx.json', `${JSON.stringify(writeContext, null, 2)}\n`);
  }
}

/**
 * Returns a promise that resolves after the specified number of milliseconds.
 * */
export function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

/**
 * Truncates a string to the given length, appending ".." if it exceeds the limit.
 * */
export function truncateString(inputString: string, inputNumber: number) {
  if (inputString.length > inputNumber) {
    return `${inputString.slice(0, inputNumber)}..`;
  }

  return inputString;
}

/**
 * Converts a Ukrainian oblast name from nominative to accusative grammatical case.
 *
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
 * Extracts basic user identification data (username, full name, user ID) from the context.
 *
 * @param {GrammyContext} context
 * */
export function getUserData(context: GrammyContext) {
  const username = context.from?.username;
  const fullName = context.from?.last_name ? `${context.from?.first_name} ${context.from?.last_name}` : context.from?.first_name;
  const writeUsername = username ? `@${username}` : (fullName ?? '');
  const userId = context.from?.id;

  return {
    username,
    fullName,
    writeUsername,
    userId,
  };
}

/**
 * @description Returns valid ukrainian conjunctions
 *
 * @param array - array to join into conjunctions
 *
 * @example
 * ```ts
 * joinUkrainianConjunctions(['слово']); // слово
 * joinUkrainianConjunctions(['слово', 'діло']); // слово та діло
 * joinUkrainianConjunctions(['слово', 'діло', 'справа', 'енергія']); // слово, діло, справа та енергія
 * ```
 * */
export function joinUkrainianConjunctions(array: string[]): string {
  if (array.length <= 1) {
    return array.join(', ');
  }

  const lastItem = array.at(-1);
  const joinSlice = array.slice(0, -1);

  const resultSlice = joinSlice.join(', ');

  return `${resultSlice} та ${lastItem}`;
}

/**
 * Builds a human-readable Ukrainian string listing all enabled chat moderation features.
 * */
export function getEnabledFeaturesString(chatSettings: ChatSettings): string {
  const features: string[] = [];

  const featureNameMap = new Map<keyof ChatSettings, string>([
    ['enableDeleteUrls', '🔗 посиланнями'],
    ['enableDeleteMentions', '⚓ згадками'],
    ['enableDeleteLocations', '📍 локаціями'],
    ['enableDeleteForwards', '↩️ пересиланнями'],
    ['enableDeleteCards', '💳 картками'],
    ['enableDeleteChannelMessages', '💬 від каналів'],
    ['enableDeleteDenylist', '🚫 забороненими словами'],
  ]);

  /**
   * Повідомлень з...
   * */

  const settingsKeys = Object.keys(chatSettings) as (keyof ChatSettings)[];

  settingsKeys.forEach((setting) => {
    // eslint-disable-next-line security/detect-object-injection
    const value = chatSettings[setting];

    if (typeof value === 'boolean' && value) {
      const featureName = featureNameMap.get(setting);

      if (featureName) {
        features.push(featureName);
      }
    }

    if (Array.isArray(value) && value.length > 0) {
      const featureName = featureNameMap.get(setting);

      if (featureName) {
        features.push(featureName);
      }
    }
  });

  return joinUkrainianConjunctions(features);
}

/**
 * Returns a random element from the given array.
 *
 * @template T
 *
 * @param {T[]} array
 * @returns {T} - random item from array
 * */
export function getRandomItem<T>(array: T[]): T {
  // eslint-disable-next-line sonarjs/pseudo-random
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Logs a debug message when a middleware is skipped, including the reason and chat title.
 *
 * @param {GrammyContext} context
 * @param {string} reason
 * @param {any} [extra]
 * */
export function logSkipMiddleware(context: GrammyContext, reason: string, extra?: any) {
  if (environmentConfig.DEBUG || environmentConfig.DEBUG_MIDDLEWARE) {
    // @ts-ignore

    logger.info(`Skip due to ${reason} in chat ${context.chat?.title || '$empty_title'}`, extra);
  }
}

/**
 * Checks whether the given user ID is in the global whitelist.
 *
 * @param {number} id
 * */
export function isIdWhitelisted(id: number | undefined) {
  // If channel or no id for some reason, it's not whitelisted
  if (!id) {
    return false;
  }

  const whitelist = (environmentConfig.USERS_WHITELIST || '').split(', ');

  return whitelist.includes(id.toString());
}

/**
 * Wraps a single value in an array, or returns the value as-is if it is already an array.
 * */
export function coerceArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

/**
 * Checks whether the given user ID is whitelisted for receiving swindler statistics.
 * */
export function isIdWhitelistedForSwindlersStatistic(id: number | undefined) {
  // If channel or no id for some reason, it's not whitelisted
  if (!id) {
    return false;
  }

  const whitelist = (environmentConfig.USERS_FOR_SWINDLERS_STATISTIC_WHITELIST || '').split(', ');

  return whitelist.includes(id.toString());
}
