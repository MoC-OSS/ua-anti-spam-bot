import { ALARM_CHANNEL, createAlarmPublisher, createAlarmSubscriber } from '@db/redis-pubsub';

const { mockRedisClient } = vi.hoisted(() => {
  const mock = {
    on: vi.fn().mockReturnThis(),
    connect: vi.fn<() => Promise<void>>().mockResolvedValue(),
    publish: vi.fn().mockResolvedValue(1),
    subscribe: vi.fn<() => Promise<void>>().mockResolvedValue(),
    disconnect: vi.fn<() => Promise<void>>().mockResolvedValue(),
  };

  return { mockRedisClient: mock };
});

vi.mock('redis', () => ({
  createClient: vi.fn().mockReturnValue(mockRedisClient),
}));

vi.mock('@shared/config', () => ({
  environmentConfig: {
    REDIS_URL: 'redis://localhost:6379',
  },
}));

describe('redis-pubsub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisClient.on.mockReturnThis();
    mockRedisClient.connect.mockResolvedValue();
    mockRedisClient.subscribe.mockResolvedValue();
    mockRedisClient.disconnect.mockResolvedValue();
  });

  describe('ALARM_CHANNEL', () => {
    it('should export the alarm channel name', () => {
      expect(ALARM_CHANNEL).toBe('alarm:updates');
    });
  });

  describe('createAlarmPublisher', () => {
    describe('positive cases', () => {
      it('should create a Redis client and connect it', async () => {
        const { createClient } = await import('redis');

        await createAlarmPublisher();

        expect(createClient).toHaveBeenCalledWith({ url: 'redis://localhost:6379' });
        expect(mockRedisClient.connect).toHaveBeenCalledOnce();
      });

      it('should return the connected client', async () => {
        const publisher = await createAlarmPublisher();

        expect(publisher).toBe(mockRedisClient);
      });
    });
  });

  describe('createAlarmSubscriber', () => {
    describe('positive cases', () => {
      it('should create a Redis client, connect it, and subscribe to the alarm channel', async () => {
        const handler = vi.fn();

        await createAlarmSubscriber(handler);

        expect(mockRedisClient.connect).toHaveBeenCalledOnce();
        expect(mockRedisClient.subscribe).toHaveBeenCalledWith(ALARM_CHANNEL, handler);
      });

      it('should return the connected client', async () => {
        const subscriber = await createAlarmSubscriber(vi.fn());

        expect(subscriber).toBe(mockRedisClient);
      });
    });
  });
});
