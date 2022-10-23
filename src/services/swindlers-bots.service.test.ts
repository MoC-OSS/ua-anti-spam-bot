import { mockDynamicStorageService, mockNewBot } from './_mocks/index.mocks';
import { SwindlersBotsService } from './swindlers-bots.service';

const expectedMentions = ['@test_mention', '@another_mention'];
const expectedUrls = ['t.me/test_mention', 'https://t.me/another_mention', 'not-t.me/not-a-mention'];

/**
 * @type {SwindlersBotsService}
 * */
let swindlersBotsService: SwindlersBotsService;
describe('SwindlersBotsService', () => {
  beforeAll(() => {
    swindlersBotsService = new SwindlersBotsService(mockDynamicStorageService, 0.6);
  });

  it('should compare new bot', () => {
    const result = swindlersBotsService.isSpamBot(mockNewBot);
    console.info(result);

    expect(result.isSpam).toEqual(true);
  });

  it('should recreate fuzzyset on fetch', async () => {
    const initFuzzySetSpy = jest.spyOn(swindlersBotsService, 'initFuzzySet');
    const oldFuzzyMatch = swindlersBotsService.swindlersBotsFuzzySet;

    expect(initFuzzySetSpy).not.toHaveBeenCalled();
    await mockDynamicStorageService.updateSwindlers();
    const newFuzzyMatch = swindlersBotsService.swindlersBotsFuzzySet;

    expect(oldFuzzyMatch).not.toEqual(newFuzzyMatch);
    expect(initFuzzySetSpy).toHaveBeenCalled();

    initFuzzySetSpy.mockRestore();
  });

  describe('parseMentions', () => {
    it('should parse mentions from texts', () => {
      const text = `test message with ${expectedMentions[0]}. Find it here: ${expectedMentions[1]}`;
      const result = swindlersBotsService.parseMentions(text);

      expect(result).toEqual(expectedMentions);
    });

    it('should parse urls from texts', () => {
      const text = `test message with ${expectedUrls[0]}. Find it here: ${expectedUrls[1]}. Should not match: ${expectedUrls[2]}`;
      const result = swindlersBotsService.parseMentions(text);

      console.info(text);

      expect(result).toEqual(expectedMentions);
    });

    it('should remove duplicated mentions', () => {
      const text = `${expectedMentions[0]} ${expectedMentions[0]}`;
      const result = swindlersBotsService.parseMentions(text);

      expect(result).toEqual([expectedMentions[0]]);
    });

    it('should parse mentions and urls from texts', () => {
      const text = `@another_test ${expectedUrls[0]}. Find it here: ${expectedMentions[1]} ${expectedUrls[1]}. Should not match: ${expectedMentions[2]} ${expectedUrls[2]}`;
      const result = swindlersBotsService.parseMentions(text);

      console.info(text);

      expect(result).toEqual(['@another_test', '@another_mention', '@test_mention']);
    });

    it('should exclude mentions from exclude list', () => {
      const text = `@another_test ${swindlersBotsService.exceptionMentions[0]}`;
      const result = swindlersBotsService.parseMentions(text);

      console.info(text);

      expect(result).toEqual(['@another_test']);
    });
  });

  describe('processMessage', () => {
    it('should process message any find swindlers bots', () => {
      const result = swindlersBotsService.processMessage(`test message ${mockNewBot} with swindler bot`);

      expect(result).toBeTruthy();
      expect(result?.isSpam).toBeTruthy();
    });

    it('should not process regular message', () => {
      const result = swindlersBotsService.processMessage(`test message without @test_bot swindler bot `);

      expect(result).toBeFalsy();
    });
  });
});
