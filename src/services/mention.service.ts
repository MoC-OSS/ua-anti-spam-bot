import { removeDuplicates } from '../utils';

export class MentionService {
  readonly mentionRegexp = /\B@\w+/g;

  readonly urlRegexp =
    /(https?:\/\/(?:www\.|(?!www))?[\dA-Za-z][\dA-Za-z-]+[\dA-Za-z]\.\S{2,}|www\.[\dA-Za-z][\dA-Za-z-]+[\dA-Za-z]\.\S{2,}|(https?:\/\/(?:www\.|(?!www)))?[\dA-Za-z-]+\.\S{2,}|www\.?[\dA-Za-z]+\.\S{2,})/g;

  /**
   * @param {string} message - raw message from user to parse
   * @param exceptionMentions - mentions to exclude from list
   *
   * @returns {string[]}
   */
  parseMentions(message: string, exceptionMentions: string[] = []): string[] {
    const directMentions = message.match(this.mentionRegexp) || [];
    const linkMentions = (message.match(this.urlRegexp) || [])
      .filter((url) => url.split('/').includes('t.me'))
      .map((url) => url.split('/').splice(-1)[0])
      .map((mention) => (mention[mention.length - 1] === '.' ? `@${mention.slice(0, -1)}` : `@${mention}`));

    return removeDuplicates([...directMentions, ...linkMentions]).filter((item) => !exceptionMentions.includes(item));
  }
}

export const mentionService = new MentionService();
