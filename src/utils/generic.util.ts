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
 * @param {GrammyContext} context
 * */
export function logContext(context: GrammyContext) {
  if (environmentConfig.DEBUG) {
    const writeContext = optimizeWriteContextUtility(context);

    logger.info(JSON.stringify(writeContext, null, 2));

    fs.writeFileSync('./last-ctx.json', `${JSON.stringify(writeContext, null, 2)}\n`);
  }
}

export function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export function truncateString(inputString: string, inputNumber: number) {
  if (inputString.length > inputNumber) {
    return `${inputString.slice(0, inputNumber)}..`;
  }

  return inputString;
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

export function coerceArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export function isIdWhitelistedForSwindlersStatistic(id: number | undefined) {
  // If channel or no id for some reason, it's not whitelisted
  if (!id) {
    return false;
  }

  const whitelist = (environmentConfig.USERS_FOR_SWINDLERS_STATISTIC_WHITELIST || '').split(', ');

  return whitelist.includes(id.toString());
}
