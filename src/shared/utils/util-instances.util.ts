/**
 * @module util-instances
 * @description Singleton instances of common utility classes used across the bot.
 */

import { MessageUtility } from './message.util';
import { TelegramUtility } from './telegram.util';

/** Singleton instance of {@link MessageUtility} for fuzzy text matching. */
export const messageUtility = new MessageUtility();

/** Singleton instance of {@link TelegramUtility} for Telegram API helpers. */
export const telegramUtility = new TelegramUtility();
