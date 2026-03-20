/**
 * @module language.command
 * @description Handles the /language command that lets chat administrators switch
 * the bot's reply language for the current group chat. In private chats, the user
 * may still switch their own bot language. Supported locales: 'uk' (Ukrainian) and
 * 'en' (English).
 *
 * Behaviour:
 *  - `/language`     — toggles between Ukrainian and English
 *  - `/language uk`  — sets the language to Ukrainian
 *  - `/language en`  — sets the language to English
 *  - any other value — replies with an error listing supported codes
 */

import { getIsNotAdminMessage } from '@message/settings.message';

import type { GrammyCommandMiddleware } from '@app-types/context';

/** Languages supported by the bot UI. */
const SUPPORTED_LANGUAGES = ['uk', 'en'] as const;

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Returns true when the given string is a supported language code.
 * @param value - The string to validate.
 * @returns True if value is a known language code, false otherwise.
 */
function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Returns the language that should replace the current one when no explicit
 * language argument is given (toggle behaviour).
 * @param current - The current language code stored in the chat session.
 * @returns The toggled language code.
 */
function toggleLanguage(current: string): SupportedLanguage {
  return current === 'uk' ? 'en' : 'uk';
}

/** Handles the /language command for changing the chat UI language. */
export class LanguageCommand {
  /**
   * Returns the Grammy middleware for the /language command.
   * @returns The Grammy command middleware function.
   */
  middleware(): GrammyCommandMiddleware {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context) => {
      const isPrivateChat = context.chat?.type === 'private';
      const isActualUserAdmin = Boolean(context.state.isActualUserAdmin);
      const rawArgument = context.match?.toString().trim().toLowerCase() ?? '';
      const currentLanguage = context.chatSession.language ?? 'uk';

      if (!isPrivateChat && !isActualUserAdmin) {
        await context.replyWithSelfDestructedHTML(getIsNotAdminMessage(context));

        return;
      }

      let newLanguage: SupportedLanguage;

      if (!rawArgument) {
        newLanguage = toggleLanguage(currentLanguage);
      } else if (isSupportedLanguage(rawArgument)) {
        newLanguage = rawArgument;
      } else {
        await context.reply(context.t('language-invalid'));

        return;
      }

      context.chatSession.language = newLanguage;
      context.i18n.useLocale(newLanguage);

      await context.reply(context.t('language-changed', { language: newLanguage }));
    };
  }
}
