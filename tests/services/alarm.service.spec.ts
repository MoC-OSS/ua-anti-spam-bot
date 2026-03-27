import { ALARM_CLOSE_KEY, ALARM_CONNECT_KEY, ALARM_EVENT_KEY, AlarmService, TEST_ALARM_STATE } from '@services/alarm.service';

import type { AlarmPubSubMessage } from '@app-types/stfalcon-alarm';

const mockSubscriber = {
  disconnect: vi.fn<() => Promise<void>>().mockResolvedValue(),
};

const { createAlarmSubscriberMock, captureSubscriberHandler } = vi.hoisted(() => {
  let capturedHandler: ((message: string) => void) | null = null;

  const mock = vi.fn().mockImplementation((handler: (message: string) => void) => {
    capturedHandler = handler;

    return Promise.resolve(mockSubscriber);
  });

  return {
    createAlarmSubscriberMock: mock,
    captureSubscriberHandler: () => capturedHandler,
  };
});

vi.mock('@db/redis-pubsub', () => ({
  createAlarmSubscriber: createAlarmSubscriberMock,
  ALARM_CHANNEL: 'alarm:updates',
}));

vi.mock('@services/stfalcon-alarm-api.service', () => ({
  stfalconAlarmApiService: {
    getAlerts: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@shared/config', () => ({
  environmentConfig: {
    DISABLE_ALARM_API: false,
    ALARM_KEY: 'test-key',
    ENV: 'test',
    REDIS_URL: 'redis://localhost:6379',
  },
}));

describe('AlarmService', () => {
  let service: AlarmService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new AlarmService();
    vi.clearAllMocks();
    mockSubscriber.disconnect.mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('getStates', () => {
    describe('positive cases', () => {
      it('should return mapped states when API returns regions', async () => {
        const { stfalconAlarmApiService } = await import('@services/stfalcon-alarm-api.service');

        vi.mocked(stfalconAlarmApiService.getAlerts).mockResolvedValue([
          {
            regionId: '4',
            regionName: 'Львівська область',
            regionType: 'State',
            lastUpdate: '2024-01-01T12:00:00Z',
            activeAlerts: [{ regionId: '4', regionType: 'State', type: 'AIR', lastUpdate: '2024-01-01T12:00:00Z' }],
          },
        ]);

        const result = await service.getStates();

        expect(result.states).toHaveLength(1);

        expect(result.states[0]).toMatchObject({
          id: 4,
          name: 'Львівська область',
          alert: true,
        });

        expect(result.last_update).toBeDefined();
      });

      it('should return empty states when API returns no regions', async () => {
        const { stfalconAlarmApiService } = await import('@services/stfalcon-alarm-api.service');

        vi.mocked(stfalconAlarmApiService.getAlerts).mockResolvedValue([]);

        const result = await service.getStates();

        expect(result.states).toEqual([]);
      });

      it('should return alert=false when region has no active alerts', async () => {
        const { stfalconAlarmApiService } = await import('@services/stfalcon-alarm-api.service');

        vi.mocked(stfalconAlarmApiService.getAlerts).mockResolvedValue([
          {
            regionId: '5',
            regionName: 'Київська область',
            regionType: 'State',
            lastUpdate: '2024-01-01T10:00:00Z',
            activeAlerts: [],
          },
        ]);

        const result = await service.getStates();

        expect(result.states[0]).toMatchObject({ id: 5, name: 'Київська область', alert: false });
      });

      it('should return empty states and log error when API throws', async () => {
        const { stfalconAlarmApiService } = await import('@services/stfalcon-alarm-api.service');

        vi.mocked(stfalconAlarmApiService.getAlerts).mockRejectedValue(new Error('API error'));

        const result = await service.getStates();

        expect(result.states).toEqual([]);
      });
    });

    it('should return empty states without calling API when DISABLE_ALARM_API is true', async () => {
      const { stfalconAlarmApiService } = await import('@services/stfalcon-alarm-api.service');
      const { environmentConfig } = await import('@shared/config');
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const config = environmentConfig as { DISABLE_ALARM_API: boolean };

      config.DISABLE_ALARM_API = true;

      const result = await service.getStates();

      config.DISABLE_ALARM_API = false;

      expect(result.states).toEqual([]);
      expect(stfalconAlarmApiService.getAlerts).not.toHaveBeenCalled();
    });
  });

  describe('enable', () => {
    describe('positive cases', () => {
      it('should create a Redis subscriber and emit connect event', async () => {
        const emitSpy = vi.spyOn(service.updatesEmitter, 'emit');

        await service.enable('startup');

        expect(createAlarmSubscriberMock).toHaveBeenCalledOnce();
        expect(emitSpy).toHaveBeenCalledWith(ALARM_CONNECT_KEY, 'startup');
      });

      it('should not create subscriber when DISABLE_ALARM_API is true', async () => {
        const { environmentConfig } = await import('@shared/config');
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const config = environmentConfig as { DISABLE_ALARM_API: boolean };

        config.DISABLE_ALARM_API = true;
        await service.enable('test');
        config.DISABLE_ALARM_API = false;

        expect(createAlarmSubscriberMock).not.toHaveBeenCalled();
      });
    });
  });

  describe('disable', () => {
    describe('positive cases', () => {
      it('should disconnect subscriber and emit close event when subscriber is set', async () => {
        await service.enable('startup');
        const emitSpy = vi.spyOn(service.updatesEmitter, 'emit');

        await service.disable('test reason');

        expect(mockSubscriber.disconnect).toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalledWith(ALARM_CLOSE_KEY, 'test reason');
      });

      it('should not throw when no subscriber is set', async () => {
        await expect(service.disable('test')).resolves.not.toThrow();
      });

      it('should clear testAlarmInterval when set', async () => {
        service.testAlarmInterval = setInterval(() => {}, 10_000);

        await service.disable('test');

        expect(service.testAlarmInterval).toBeUndefined();
      });
    });
  });

  describe('restart', () => {
    describe('positive cases', () => {
      it('should call disable then enable', async () => {
        const disableSpy = vi.spyOn(service, 'disable').mockResolvedValue();
        const enableSpy = vi.spyOn(service, 'enable').mockResolvedValue();

        await service.restart();

        expect(disableSpy).toHaveBeenCalledWith('restart');
        expect(enableSpy).toHaveBeenCalledWith('restart');
      });
    });
  });

  describe('subscribeToRedisChannel', () => {
    describe('positive cases', () => {
      it('should emit update event when a valid pub/sub message is received', async () => {
        await service.subscribeToRedisChannel('test');

        const handler = captureSubscriberHandler();
        const emitSpy = vi.spyOn(service.updatesEmitter, 'emit');

        const message: AlarmPubSubMessage = {
          regionId: '4',
          regionName: 'Львівська область',
          alert: true,
          alertType: 'AIR',
          lastUpdate: '2024-01-01T12:00:00Z',
        };

        handler!(JSON.stringify(message));

        expect(emitSpy).toHaveBeenCalledWith(
          ALARM_EVENT_KEY,
          expect.objectContaining({
            state: expect.objectContaining({
              id: 4,
              name: 'Львівська область',
              alert: true,
            }),
          }),
        );
      });

      it('should not throw when the pub/sub message is invalid JSON', async () => {
        await service.subscribeToRedisChannel('test');

        const handler = captureSubscriberHandler();

        expect(() => handler!('invalid json')).not.toThrow();
      });

      it('should disconnect previous subscriber before creating a new one', async () => {
        await service.subscribeToRedisChannel('first');
        await service.subscribeToRedisChannel('second');

        expect(mockSubscriber.disconnect).toHaveBeenCalledOnce();
      });
    });
  });

  describe('initTestAlarms', () => {
    describe('positive cases', () => {
      it('should emit alarm event on interval', () => {
        const emitSpy = vi.spyOn(service.updatesEmitter, 'emit');

        service.initTestAlarms();

        vi.advanceTimersByTime(30_000);

        expect(emitSpy).toHaveBeenCalledWith(
          ALARM_EVENT_KEY,
          expect.objectContaining({ state: expect.objectContaining({ name: TEST_ALARM_STATE }) }),
        );
      });

      it('should toggle alert on each tick', () => {
        const emissions: boolean[] = [];

        service.updatesEmitter.on(ALARM_EVENT_KEY, (event) => {
          emissions.push(event.state.alert);
        });

        service.initTestAlarms();

        vi.advanceTimersByTime(30_000);
        vi.advanceTimersByTime(30_000);

        expect(emissions[0]).toBe(true);
        expect(emissions[1]).toBe(false);
      });
    });
  });

  describe('constants', () => {
    it('should export ALARM_CONNECT_KEY', () => {
      expect(ALARM_CONNECT_KEY).toBe('connect');
    });

    it('should export ALARM_CLOSE_KEY', () => {
      expect(ALARM_CLOSE_KEY).toBe('close');
    });

    it('should export ALARM_EVENT_KEY', () => {
      expect(ALARM_EVENT_KEY).toBe('update');
    });

    it('should export TEST_ALARM_STATE', () => {
      expect(TEST_ALARM_STATE).toBe('Московська область');
    });
  });
});
