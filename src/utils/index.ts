import { MessageUtil } from './message.util';
import { TelegramUtil } from './telegram.util';

export const messageUtil = new MessageUtil();
export const telegramUtil = new TelegramUtil();

export * from './censor-word.util';
export * from './deep-copy.util';
export * from './domain-allow-list';
export * from './empty-functions.util';
export * from './error-handler';
export * from './generic.util';
export * from './optimize-write-context.util';
export * from './remove-duplicates.util';
export * from './remove-repeated-letters.util';
export * from './remove-system-information.util';
export * from './reveal-hidden-urls.util';
export * from './search-set';
export * from './video.util';
