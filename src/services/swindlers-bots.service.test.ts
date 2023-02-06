import { mockDynamicStorageService, mockNewBot } from './_mocks/index.mocks';
import { SwindlersBotsService } from './swindlers-bots.service';

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
    await mockDynamicStorageService.updateStorage();
    const newFuzzyMatch = swindlersBotsService.swindlersBotsFuzzySet;

    expect(oldFuzzyMatch).not.toEqual(newFuzzyMatch);
    expect(initFuzzySetSpy).toHaveBeenCalled();

    initFuzzySetSpy.mockRestore();
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
