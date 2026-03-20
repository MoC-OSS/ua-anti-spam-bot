/**
 * @module verify-telegram-web-app-data
 * @description Validates Telegram Web App init data using HMAC-SHA256 signature verification.
 */

import CryptoJS from 'crypto-js';

import { environmentConfig } from '@shared/config';

/**
 * Verifies Telegram Web App init data by comparing its HMAC-SHA256 hash
 * against a hash computed from the bot token.
 * @param telegramInitData - The raw init data string from the Telegram Web App.
 * @returns `true` if the signature is valid.
 */
export const verifyTelegramWebAppData = (telegramInitData: string): boolean => {
  const initData = new URLSearchParams(telegramInitData);
  const hash = initData.get('hash');
  const dataToCheck: string[] = [];

  initData.sort();
  initData.forEach((value, key) => key !== 'hash' && dataToCheck.push(`${key}=${value}`));

  const secret = CryptoJS.HmacSHA256(environmentConfig.BOT_TOKEN, 'WebAppData');
  const computedHash = CryptoJS.HmacSHA256(dataToCheck.join('\n'), secret).toString(CryptoJS.enc.Hex);

  return computedHash === hash;
};
