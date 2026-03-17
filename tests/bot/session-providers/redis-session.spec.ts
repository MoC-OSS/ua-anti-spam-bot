import { RedisChatSession } from '@bot/session-providers/redis-chat-session-storage.provider';
import { RedisSession } from '@bot/session-providers/redis-session-storage.provider';

import type { GrammyContext } from '@app-types/context';

const { mockGetValue, mockSetValue } = vi.hoisted(() => ({
  mockGetValue: vi.fn().mockResolvedValue({}),
  // eslint-disable-next-line unicorn/no-useless-undefined
  mockSetValue: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@db/redis.client', () => ({
  getValue: mockGetValue,
  setValue: mockSetValue,
}));

describe('RedisChatSession.getSessionKey', () => {
  let instance: RedisChatSession;

  beforeEach(() => {
    instance = new RedisChatSession();
  });

  it('should return empty string when context.from is undefined', () => {
    const context = { from: undefined } as unknown as GrammyContext;

    expect(instance.getSessionKey(context)).toBe('');
  });

  it('should return chat.id as string when context.chat exists', () => {
    const context = {
      from: { id: 111 },
      chat: { id: 202_212 },
    } as unknown as GrammyContext;

    expect(instance.getSessionKey(context)).toBe('202212');
  });

  it('should return callbackQuery.chat_instance when no chat but callbackQuery exists', () => {
    const context = {
      from: { id: 111 },
      chat: undefined,
      callbackQuery: { chat_instance: 'instance-abc' },
    } as unknown as GrammyContext;

    expect(instance.getSessionKey(context)).toBe('instance-abc');
  });

  it('should return from.id as string when neither chat nor callbackQuery exists', () => {
    const context = {
      from: { id: 999 },
      chat: undefined,
      callbackQuery: undefined,
    } as unknown as GrammyContext;

    expect(instance.getSessionKey(context)).toBe('999');
  });
});

describe('RedisSession.getSessionKey', () => {
  let instance: RedisSession;

  beforeEach(() => {
    instance = new RedisSession();
  });

  it('should return empty string when context.from is undefined', () => {
    const context = { from: undefined } as unknown as GrammyContext;

    expect(instance.getSessionKey(context)).toBe('');
  });

  it('should return chat.id:from.id when context.chat exists', () => {
    const context = {
      from: { id: 111 },
      chat: { id: 202_212 },
    } as unknown as GrammyContext;

    expect(instance.getSessionKey(context)).toBe('202212:111');
  });

  it('should return callbackQuery.chat_instance:from.id when no chat but callbackQuery exists', () => {
    const context = {
      from: { id: 222 },
      chat: undefined,
      callbackQuery: { chat_instance: 'instance-xyz' },
    } as unknown as GrammyContext;

    expect(instance.getSessionKey(context)).toBe('instance-xyz:222');
  });

  it('should return from.id:from.id when neither chat nor callbackQuery exists', () => {
    const context = {
      from: { id: 555 },
      chat: undefined,
      callbackQuery: undefined,
    } as unknown as GrammyContext;

    expect(instance.getSessionKey(context)).toBe('555:555');
  });
});
