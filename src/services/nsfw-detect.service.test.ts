import { getMockDynamicStorageService } from './_mocks/index.mocks';
import type { DynamicStorageService } from './dynamic-storage.service';
import { NsfwDetectService } from './nsfw-detect.service';

/**
 * @type {SwindlersBotsService}
 * */
let nsfwDetectService: NsfwDetectService;
let mockDynamicStorageService: DynamicStorageService;
describe('NsfwDetectService', () => {
  beforeEach(() => {
    mockDynamicStorageService = getMockDynamicStorageService();
    nsfwDetectService = new NsfwDetectService(mockDynamicStorageService, 0.6);
  });

  it('should compare new message', () => {
    const result = nsfwDetectService.isSpamMessage('Радую голой фоточкой всіх нових в каналі');
    console.info(result);

    expect(result.isSpam).toEqual(true);
  });

  it('should recreate fuzzyset on fetch', async () => {
    const initFuzzySetSpy = jest.spyOn(nsfwDetectService, 'initFuzzySet');
    const oldFuzzyMatch = nsfwDetectService.nsfwMessagesFuzzySet;

    expect(initFuzzySetSpy).not.toHaveBeenCalled();
    await mockDynamicStorageService.updateStorage();
    const newFuzzyMatch = nsfwDetectService.nsfwMessagesFuzzySet;

    expect(oldFuzzyMatch).not.toEqual(newFuzzyMatch);
    expect(initFuzzySetSpy).toHaveBeenCalled();

    initFuzzySetSpy.mockRestore();
  });

  describe('processMessage', () => {
    it('should process message when find any nsfw message', () => {
      const result = nsfwDetectService.processMessage('Радую голой фоточкой всіх нових в каналі');
      console.info(result);

      expect(result).toBeTruthy();
      expect(result?.isSpam).toBeTruthy();
    });

    it('should not process regular message', () => {
      const result = nsfwDetectService.processMessage(`Я додам нові фотографії зими з новорічної події`);

      expect(result).toBeFalsy();
    });
  });
});
