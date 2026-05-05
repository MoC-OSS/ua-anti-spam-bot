import moment from 'moment-timezone';

import {
  alarmEndNotificationMessage,
  chatIsMutedMessage,
  chatIsUnmutedMessage,
  getAirRaidAlarmSettingsMessage,
  getAlarmStartNotificationMessage,
  getDayTimeEmoji,
  isNight,
} from '@bot/messages/alarm.message';

vi.mock('moment-timezone', () => {
  const mockMoment: any = vi.fn(() => ({
    format: vi.fn((formatString: string) => {
      if (formatString === 'H') {
        return '10';
      }

      return '10:00';
    }),
    locale: vi.fn().mockReturnThis(),
  }));

  mockMoment.tz = vi.fn().mockReturnValue({ format: vi.fn(() => '10:00') });

  return { default: mockMoment };
});

vi.mock('@bot/i18n', () => ({
  i18n: {
    t: vi.fn((locale: string, key: string, parameters?: object) => `${locale}:${key}${parameters ? JSON.stringify(parameters) : ''}`),
  },
  ALARM_START_GENERIC_COUNT: 3,
  ALARM_END_GENERIC_COUNT: 4,
  ALARM_END_NIGHT_COUNT: 2,
  ALARM_END_DAY_COUNT: 2,
}));

vi.mock('@utils/generic.util', () => ({
  getRandomItem: vi.fn((array: unknown[]) => array[0]),
  formatRegionNameToLocative: vi.fn((regionName: string) => `loc:${regionName}`),
}));

const testRegionName = 'Київська область';

const mockSettings = {
  airRaidAlertSettings: {
    regionIds: ['9'],
    notificationMessage: false,
  },
} as any;

describe('alarm.message', () => {
  describe('isNight', () => {
    describe('positive cases', () => {
      it('should return false during daytime (hour 10)', () => {
        expect(isNight()).toBe(false);
      });
    });
  });

  describe('getDayTimeEmoji', () => {
    describe('positive cases', () => {
      it('should return sun emoji during daytime', () => {
        const result = getDayTimeEmoji();

        expect(result).toBe('☀️');
      });
    });
  });

  describe('getAlarmStartNotificationMessage', () => {
    describe('positive cases', () => {
      it('should return formatted start notification', () => {
        const result = getAlarmStartNotificationMessage(testRegionName);

        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });

      it('should include repeated flag when isRepeatedAlarm is true', () => {
        const result = getAlarmStartNotificationMessage(testRegionName, true);

        expect(result).toContain('yes');
      });

      it('should mark non-repeated alarm', () => {
        const result = getAlarmStartNotificationMessage(testRegionName, false);

        expect(result).toContain('no');
      });
    });
  });

  describe('alarmEndNotificationMessage', () => {
    describe('positive cases', () => {
      it('should return formatted end notification (day, generic key)', () => {
        // Math.random = 0.1 → index = 1 ≤ ALARM_END_GENERIC_COUNT=4 → covers lines 68-70
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);
        const result = alarmEndNotificationMessage(testRegionName);

        randomSpy.mockRestore();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });

      it('should return formatted end notification (day, day key)', () => {
        // Math.random = 0.9 → index = 6 > ALARM_END_GENERIC_COUNT=4 → covers lines 73-75
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.9);
        const result = alarmEndNotificationMessage(testRegionName);

        randomSpy.mockRestore();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('chatIsMutedMessage', () => {
    describe('positive cases', () => {
      it('should return muted message', () => {
        const result = chatIsMutedMessage();

        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('chatIsUnmutedMessage', () => {
    describe('positive cases', () => {
      it('should return unmuted message', () => {
        const result = chatIsUnmutedMessage();

        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getAirRaidAlarmSettingsMessage', () => {
    describe('positive cases', () => {
      it('should return settings message with region name', () => {
        const mockContext = { t: vi.fn((key: string) => key) } as any;
        const result = getAirRaidAlarmSettingsMessage(mockContext, mockSettings, testRegionName);

        expect(typeof result).toBe('string');
        expect(result).toContain('alarm-settings-title');
      });

      it('should return settings message without region name', () => {
        const mockContext = { t: vi.fn((key: string) => key) } as any;
        const result = getAirRaidAlarmSettingsMessage(mockContext, mockSettings, null);

        expect(typeof result).toBe('string');
      });
    });
  });

  describe('night-time behavior', () => {
    beforeEach(() => {
      vi.mocked(moment).mockImplementation((() => ({
        format: vi.fn((formatString: string) => {
          if (formatString === 'H') {
            return '22';
          }

          return '22:00';
        }),
        locale: vi.fn().mockReturnThis(),
      })) as any);
    });

    afterEach(() => {
      vi.mocked(moment).mockImplementation((() => ({
        format: vi.fn((formatString: string) => {
          if (formatString === 'H') {
            return '10';
          }

          return '10:00';
        }),
        locale: vi.fn().mockReturnThis(),
      })) as any);
    });

    describe('isNight', () => {
      it('should return true during night-time (hour 22)', () => {
        expect(isNight()).toBe(true);
      });
    });

    describe('getDayTimeEmoji', () => {
      it('should return moon emoji during night-time', () => {
        const result = getDayTimeEmoji();

        expect(result).toBe('🌖');
      });
    });

    describe('alarmEndNotificationMessage', () => {
      it('should return a night-time end notification (generic key)', () => {
        // Math.random = 0.1 → index = 1 ≤ ALARM_END_GENERIC_COUNT=4 → covers lines 52-56
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);
        const result = alarmEndNotificationMessage(testRegionName);

        randomSpy.mockRestore();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });

      it('should return a night-time end notification (night key)', () => {
        // Math.random = 0.9 → index = 6 > ALARM_END_GENERIC_COUNT=4 → covers lines 58-60
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.9);
        const result = alarmEndNotificationMessage(testRegionName);

        randomSpy.mockRestore();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe('getAlarmStartNotificationMessage', () => {
      it('should return a night-time start notification', () => {
        const result = getAlarmStartNotificationMessage(testRegionName);

        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });
});
