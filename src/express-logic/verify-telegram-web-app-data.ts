import CryptoJS from 'crypto-js';

import { environmentConfig } from '../config';

export const verifyTelegramWebAppData = (telegramInitData: string): boolean => {
  const initData = new URLSearchParams(telegramInitData);
  const hash = initData.get('hash');
  const dataToCheck: string[] = [];

  initData.sort();
  initData.forEach((value, key) => key !== 'hash' && dataToCheck.push(`${key}=${value}`));

  const secret = CryptoJS.HmacSHA256(environmentConfig.BOT_TOKEN, 'WebAppData');
  const _hash = CryptoJS.HmacSHA256(dataToCheck.join('\n'), secret).toString(CryptoJS.enc.Hex);

  return _hash === hash;
};
