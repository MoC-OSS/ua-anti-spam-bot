// eslint-disable-next-line sonarjs/deprecation
import { ALARM_CLOSE_KEY, ALARM_CONNECT_KEY, ALARM_EVENT_KEY, AlarmService, TEST_ALARM_STATE } from '@services/alarm.service';

import { environmentConfig } from '@shared/config';

const { createMockEventSource, getLastMockEsInstance } = vi.hoisted(() => {
  let lastInstance: any = null;

  function createInstance() {
    const listeners: Record<string, ((...arguments_: any[]) => void)[]> = {};

    lastInstance = {
      addEventListener: vi.fn((event: string, handler: (...arguments_: any[]) => void) => {
        // eslint-disable-next-line security/detect-object-injection
        if (!listeners[event]) {
          // eslint-disable-next-line security/detect-object-injection
          listeners[event] = [];
        }

        // eslint-disable-next-line security/detect-object-injection
        listeners[event].push(handler);
      }),
      close: vi.fn(),
      _trigger(event: string, eventData?: unknown) {
        // eslint-disable-next-line security/detect-object-injection
        (listeners[event] || []).forEach((eventHandler) => eventHandler(eventData));
      },
    };

    return lastInstance;
  }

  return {
    createMockEventSource: vi.fn().mockImplementation(createInstance),
    getLastMockEsInstance: () => lastInstance,
  };
});

vi.mock('eventsource', () => ({
  EventSource: createMockEventSource,
}));

vi.mock('@shared/config', () => ({
  environmentConfig: {
    DISABLE_ALARM_API: true,
    ALARM_KEY: 'test-key',
    ENV: 'test',
  },
}));

describe('AlarmService', () => {
  // eslint-disable-next-line sonarjs/deprecation
  let service: AlarmService;

  beforeEach(() => {
    vi.useFakeTimers();
    // eslint-disable-next-line sonarjs/deprecation
    service = new AlarmService();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('getStates', () => {
    describe('positive cases', () => {
      it('should return an object with empty states array', async () => {
        const result = await service.getStates();

        expect(result.states).toEqual([]);
        expect(result.last_update).toBeDefined();
      });
    });
  });

  describe('enable', () => {
    describe('positive cases', () => {
      it('should not throw when called', () => {
        expect(() => service.enable('test')).not.toThrow();
      });
    });
  });

  describe('restart', () => {
    describe('positive cases', () => {
      it('should call enable internally', () => {
        const enableSpy = vi.spyOn(service, 'enable');

        service.restart();

        expect(enableSpy).toHaveBeenCalledWith('restart');
      });
    });
  });

  describe('disable', () => {
    describe('positive cases', () => {
      it('should not throw when source is undefined', () => {
        expect(() => service.disable('test')).not.toThrow();
      });

      it('should emit close event when source is set', () => {
        service.source = { close: vi.fn() } as any;
        const emitSpy = vi.spyOn(service.updatesEmitter, 'emit');

        service.disable('test reason');

        expect(emitSpy).toHaveBeenCalledWith(ALARM_CLOSE_KEY, 'test reason');
        expect((service.source as any).close).toHaveBeenCalled();
      });

      it('should enter the reconnectInterval branch without throwing when interval is set', () => {
        service.reconnectInterval = setInterval(() => {}, 10_000) as any;

        expect(() => service.disable('with-interval')).not.toThrow();

        clearInterval(service.reconnectInterval as any);
      });

      it('should enter the testAlarmInterval branch without throwing when interval is set', () => {
        service.testAlarmInterval = setInterval(() => {}, 10_000) as any;

        expect(() => service.disable('with-test-interval')).not.toThrow();

        clearInterval(service.testAlarmInterval as any);
      });
    });
  });

  describe('subscribeOnNotifications', () => {
    describe('positive cases', () => {
      it('should return early when DISABLE_ALARM_API is true', () => {
        const disableSpy = vi.spyOn(service, 'disable');

        service.subscribeOnNotifications('test');

        expect(disableSpy).not.toHaveBeenCalled();
      });
    });

    describe('when DISABLE_ALARM_API is false', () => {
      beforeEach(() => {
        (environmentConfig as any).DISABLE_ALARM_API = false;
        createMockEventSource.mockClear();
      });

      afterEach(() => {
        (environmentConfig as any).DISABLE_ALARM_API = true;
      });

      it('should call disable and create an EventSource', () => {
        const disableSpy = vi.spyOn(service, 'disable');

        service.subscribeOnNotifications('init');

        expect(disableSpy).toHaveBeenCalledWith('init');
        expect(createMockEventSource).toHaveBeenCalledOnce();
        expect(service.source).toBeDefined();
      });

      it('should emit connect event on first "hello" event', () => {
        const emitSpy = vi.spyOn(service.updatesEmitter, 'emit');

        service.subscribeOnNotifications('init');
        const es = getLastMockEsInstance();

        es._trigger('hello');

        expect(emitSpy).toHaveBeenCalledWith(ALARM_CONNECT_KEY, 'init');
      });

      it('should NOT emit connect event on subsequent "hello" events', () => {
        const emitSpy = vi.spyOn(service.updatesEmitter, 'emit');

        service.subscribeOnNotifications('init');
        const es = getLastMockEsInstance();

        es._trigger('hello');
        emitSpy.mockClear();
        es._trigger('hello');

        expect(emitSpy).not.toHaveBeenCalledWith(ALARM_CONNECT_KEY, expect.anything());
      });

      it('should emit update event with parsed data when "update" event fires with valid data', () => {
        const emitSpy = vi.spyOn(service.updatesEmitter, 'emit');

        const notification = {
          state: { alert: true, id: 1, name: 'Kyiv', name_en: 'Kyiv', changed: '2024-01-01T00:00:00.000Z' },
          notification_id: 'n1',
        };

        service.subscribeOnNotifications('init');
        const es = getLastMockEsInstance();

        es._trigger('update', { data: JSON.stringify(notification) });

        expect(emitSpy).toHaveBeenCalledWith(ALARM_EVENT_KEY, notification);
      });

      it('should NOT emit update when "update" event fires with null data', () => {
        const emitSpy = vi.spyOn(service.updatesEmitter, 'emit');

        service.subscribeOnNotifications('init');
        const es = getLastMockEsInstance();

        es._trigger('update', { data: JSON.stringify(null) });

        expect(emitSpy).not.toHaveBeenCalledWith(ALARM_EVENT_KEY, expect.anything());
      });

      it('should register "error" and "open" event listeners without throwing', () => {
        service.subscribeOnNotifications('init');
        const es = getLastMockEsInstance();

        expect(() => es._trigger('error', { message: 'connection error' })).not.toThrow();
        expect(() => es._trigger('open')).not.toThrow();
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

      it('should toggle isAlert on each tick', () => {
        const emissions: any[] = [];

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
