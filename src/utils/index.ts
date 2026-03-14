import { MessageUtil as MessageUtility } from './message.util';
import { TelegramUtil as TelegramUtility } from './telegram.util';

export const messageUtil = new MessageUtility();

export const telegramUtil = new TelegramUtility();

export * from './censor-word.util';

export * from './deep-copy.util';

export * from './domain-allow-list';

export * from './empty-functions.util';

export * from './error-handler';

export * from './generic.util';

export * from './get-typed-value.util';

export * from './optimize-write-context.util';

export * from './remove-duplicates.util';

export * from './remove-repeated-letters.util';

export * from './remove-system-information.util';

export * from './reveal-hidden-urls.util';

export * from './search-set';

export * from './video.util';
