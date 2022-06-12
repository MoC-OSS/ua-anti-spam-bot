const { mockDynamicStorageService, mockNewBot } = require('./_mocks/index.mocks');
const { SwindlersBotsService } = require('./swindlers-bots.service');

/**
 * @type {SwindlersBotsService}
 * */
let swindlersBotsService;
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

    expect(initFuzzySetSpy).not.toBeCalled();
    await mockDynamicStorageService.updateSwindlers();
    const newFuzzyMatch = swindlersBotsService.swindlersBotsFuzzySet;

    expect(oldFuzzyMatch).not.toEqual(newFuzzyMatch);
    expect(initFuzzySetSpy).toHaveBeenCalled();

    initFuzzySetSpy.mockRestore();
  });
});
