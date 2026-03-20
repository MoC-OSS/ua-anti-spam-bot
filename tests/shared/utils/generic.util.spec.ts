import {
  coerceArray,
  getEnabledFeaturesString,
  getRandomItem,
  getUserData,
  isIdWhitelisted,
  isIdWhitelistedForSwindlersStatistic,
  sleep,
  truncateString,
} from '@utils/generic.util';

vi.mock('@shared/config', () => ({
  environmentConfig: {
    DEBUG: false,
    DEBUG_MIDDLEWARE: false,
    USERS_WHITELIST: '100, 200, 300',
    USERS_FOR_SWINDLERS_STATISTIC_WHITELIST: '400, 500',
  },
}));

describe('sleep', () => {
  describe('positive cases', () => {
    it('should resolve after the specified time', async () => {
      const start = Date.now();

      await sleep(50);

      expect(Date.now() - start).toBeGreaterThanOrEqual(40);
    });
  });
});

describe('truncateString', () => {
  describe('positive cases', () => {
    it('should truncate a string that exceeds the limit', () => {
      expect(truncateString('Hello World', 5)).toBe('Hello..');
    });

    it('should return the original string when within limit', () => {
      expect(truncateString('Hi', 10)).toBe('Hi');
    });

    it('should return the original string when equal to limit', () => {
      expect(truncateString('Hello', 5)).toBe('Hello');
    });
  });
});

describe('getUserData', () => {
  describe('positive cases', () => {
    it('should return username, full name, writeUsername, and userId', () => {
      const context: any = {
        from: { id: 123, username: 'john_doe', first_name: 'John', last_name: 'Doe' },
      };

      const result = getUserData(context);

      expect(result.username).toBe('john_doe');
      expect(result.fullName).toBe('John Doe');
      expect(result.writeUsername).toBe('@john_doe');
      expect(result.userId).toBe(123);
    });

    it('should return full name without last_name when only first_name exists', () => {
      const context: any = {
        from: { id: 456, first_name: 'Jane', username: undefined },
      };

      const result = getUserData(context);

      expect(result.fullName).toBe('Jane');
      expect(result.writeUsername).toBe('Jane');
    });

    it('should handle missing from field', () => {
      const context: any = { from: undefined };
      const result = getUserData(context);

      expect(result.username).toBeUndefined();
      expect(result.userId).toBeUndefined();
    });
  });
});

describe('getEnabledFeaturesString', () => {
  describe('positive cases', () => {
    it('should list enabled boolean features', () => {
      const settings: any = {
        enableDeleteUrls: true,
        enableDeleteMentions: false,
        enableDeleteLocations: false,
        enableDeleteForwards: false,
        enableDeleteCards: false,
        enableDeleteChannelMessages: false,
        enableDeleteDenylist: false,
      };

      const result = getEnabledFeaturesString(settings);

      expect(result).toContain('посиланнями');
    });

    it('should join multiple features with Ukrainian conjunctions', () => {
      const settings: any = {
        enableDeleteUrls: true,
        enableDeleteMentions: true,
        enableDeleteLocations: false,
        enableDeleteForwards: false,
        enableDeleteCards: false,
        enableDeleteChannelMessages: false,
        enableDeleteDenylist: false,
      };

      const result = getEnabledFeaturesString(settings);

      expect(result).toContain(' та ');
    });

    it('should return empty string when no features are enabled', () => {
      const settings: any = {
        enableDeleteUrls: false,
        enableDeleteMentions: false,
        enableDeleteLocations: false,
        enableDeleteForwards: false,
        enableDeleteCards: false,
        enableDeleteChannelMessages: false,
        enableDeleteDenylist: false,
      };

      const result = getEnabledFeaturesString(settings);

      expect(result).toBe('');
    });

    it('should list array-type features when non-empty', () => {
      const settings: any = {
        enableDeleteDenylist: ['word1', 'word2'],
        enableDeleteUrls: false,
        enableDeleteMentions: false,
        enableDeleteLocations: false,
        enableDeleteForwards: false,
        enableDeleteCards: false,
        enableDeleteChannelMessages: false,
      };

      const result = getEnabledFeaturesString(settings);

      expect(result).toContain('забороненими словами');
    });
  });
});

describe('getRandomItem', () => {
  describe('positive cases', () => {
    it('should return an item from the array', () => {
      const array = [1, 2, 3, 4, 5];
      const result = getRandomItem(array);

      expect(array).toContain(result);
    });

    it('should return the only item when array has one element', () => {
      expect(getRandomItem(['only'])).toBe('only');
    });
  });
});

describe('isIdWhitelisted', () => {
  describe('positive cases', () => {
    it('should return true for a whitelisted user ID', () => {
      expect(isIdWhitelisted(100)).toBe(true);
    });

    it('should return true for another whitelisted ID', () => {
      expect(isIdWhitelisted(200)).toBe(true);
    });
  });

  describe('negative cases', () => {
    it('should return false for a non-whitelisted ID', () => {
      expect(isIdWhitelisted(999)).toBe(false);
    });

    it('should return false for undefined', () => {
      // eslint-disable-next-line unicorn/no-useless-undefined
      expect(isIdWhitelisted(undefined)).toBe(false);
    });
  });
});

describe('coerceArray', () => {
  describe('positive cases', () => {
    it('should wrap a single value in an array', () => {
      expect(coerceArray('hello')).toEqual(['hello']);
    });

    it('should return the array as-is when already an array', () => {
      const array = [1, 2, 3];

      expect(coerceArray(array)).toBe(array);
    });

    it('should wrap a number in an array', () => {
      expect(coerceArray(42)).toEqual([42]);
    });
  });
});

describe('isIdWhitelistedForSwindlersStatistic', () => {
  describe('positive cases', () => {
    it('should return true for a whitelisted ID', () => {
      expect(isIdWhitelistedForSwindlersStatistic(400)).toBe(true);
    });
  });

  describe('negative cases', () => {
    it('should return false for a non-whitelisted ID', () => {
      expect(isIdWhitelistedForSwindlersStatistic(999)).toBe(false);
    });

    it('should return false for undefined', () => {
      // eslint-disable-next-line unicorn/no-useless-undefined
      expect(isIdWhitelistedForSwindlersStatistic(undefined)).toBe(false);
    });
  });
});
