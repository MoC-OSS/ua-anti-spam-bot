/**
 * @module mention.service
 * @description Extracts @-mentions from messages, filtering out URLs and known exception accounts.
 */

import { removeDuplicates } from '@utils/remove-duplicates.util';

export class MentionService {
  readonly mentionRegexp = /\B@\w+/g;

  readonly nonWordRegex = /\W/;

  readonly urlRegexp =
    // eslint-disable-next-line security/detect-unsafe-regex, sonarjs/slow-regex, sonarjs/regex-complexity, sonarjs/empty-string-repetition
    /(https?:\/\/(?:www\.|(?!www))?[\dA-Za-z][\dA-Za-z-]+[\dA-Za-z]\.\S{2,}|www\.[\dA-Za-z][\dA-Za-z-]+[\dA-Za-z]\.\S{2,}|(https?:\/\/(?:www\.|(?!www)))?[\dA-Za-z-]+\.\S{2,}|www\.?[\dA-Za-z]+\.\S{2,})/g;

  /**
   * @param {string} message - raw message from user to parse
   * @param exceptionMentions - mentions to exclude from list
   *
   * @returns {string[]}
   */
  parseMentions(message: string, exceptionMentions: string[] = []): string[] {
    // eslint-disable-next-line sonarjs/prefer-regexp-exec
    const directMentions = message.match(this.mentionRegexp) || [];

    // eslint-disable-next-line sonarjs/prefer-regexp-exec
    const linkMentions = (message.match(this.urlRegexp) || [])
      .filter((url) => url.split('/').includes('t.me'))
      .map((url) => url.split('/').splice(-1)[0])
      .map((mention) => (this.nonWordRegex.test(mention.slice(-1)) ? `@${mention.slice(0, -1)}` : `@${mention}`));

    return removeDuplicates([...directMentions, ...linkMentions]).filter((item) => !exceptionMentions.includes(item));
  }
}

export const mentionService = new MentionService();
