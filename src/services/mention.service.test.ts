import { mentionService } from './mention.service';

const expectedMentions = ['@test_mention', '@another_mention'];
const expectedUrls = ['t.me/test_mention', 'https://t.me/another_mention', 'not-t.me/not-a-mention'];

describe('MentionService', () => {
  describe('parseMentions', () => {
    it('should parse mentions from texts', () => {
      const text = `test message with ${expectedMentions[0]}. Find it here: ${expectedMentions[1]}`;
      const result = mentionService.parseMentions(text);

      expect(result).toEqual(expectedMentions);
    });

    it('should parse urls from texts', () => {
      const text = `test message with ${expectedUrls[0]}. Find it here: ${expectedUrls[1]}. Should not match: ${expectedUrls[2]}`;
      const result = mentionService.parseMentions(text);

      console.info(text);

      expect(result).toEqual(expectedMentions);
    });

    it('should remove duplicated mentions', () => {
      const text = `${expectedMentions[0]} ${expectedMentions[0]}`;
      const result = mentionService.parseMentions(text);

      expect(result).toEqual([expectedMentions[0]]);
    });

    it('should parse mentions and urls from texts', () => {
      const text = `@another_test ${expectedUrls[0]}. Find it here: ${expectedMentions[1]} ${expectedUrls[1]}. Should not match: ${expectedMentions[2]} ${expectedUrls[2]}`;
      const result = mentionService.parseMentions(text);

      console.info(text);

      expect(result).toEqual(['@another_test', '@another_mention', '@test_mention']);
    });

    it('should exclude special symbols', () => {
      const text = `@UAdopamoga_bot,#$%^&*()-_= @UAdopamoga_bot,`;
      const result = mentionService.parseMentions(text);

      expect(result).toEqual(['@UAdopamoga_bot']);
    });

    it('should exclude special symbols from url', () => {
      const text = `https://t.me/test, https://t.me/test. https://t.me/test!`;
      const result = mentionService.parseMentions(text);

      expect(result).toEqual(['@test']);
    });

    it('should exclude mentions from exclude list', () => {
      const exceptionMentions = ['@exception_mention'];
      const text = `@another_test ${exceptionMentions[0]}`;
      const result = mentionService.parseMentions(text, exceptionMentions);

      console.info(text);

      expect(result).toEqual(['@another_test']);
    });
  });
});
