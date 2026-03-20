import type { NextFunction } from 'grammy';

import { parseMentions } from '@bot/middleware/parse-mentions.middleware';

import type { GrammyContext } from '@app-types/context';

const { mockParseMentions } = vi.hoisted(() => ({
  mockParseMentions: vi.fn().mockReturnValue([]),
}));

vi.mock('@services/mention.service', () => ({
  mentionService: { parseMentions: mockParseMentions },
}));

vi.mock('@utils/remove-duplicates.util', () => ({
  removeDuplicates: (array: unknown[]) => array,
}));

/**
 *
 * @param overrides
 */
function buildContext(overrides: Partial<GrammyContext> = {}): GrammyContext {
  return {
    state: {},
    ...overrides,
  } as unknown as GrammyContext;
}

describe('parseMentions', () => {
  let next: NextFunction;

  beforeEach(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    next = vi.fn().mockResolvedValue(undefined);
    vi.clearAllMocks();
    mockParseMentions.mockReturnValue([]);
  });

  describe('when text is absent or mentions already set', () => {
    it('should skip parsing when state has no text', () => {
      const context = buildContext({ state: {} as any });

      parseMentions(context, next);

      expect(mockParseMentions).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });

    it('should skip parsing when state.mentions is already set', () => {
      const context = buildContext({ state: { text: 'hello', mentions: ['@existing'] } as any });

      parseMentions(context, next);

      expect(mockParseMentions).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe('when text is present and mentions not yet set', () => {
    it('should parse mentions from text and set state.mentions', () => {
      mockParseMentions.mockReturnValue(['@alice']);
      const context = buildContext({ state: { text: 'hello @alice' } as any });

      parseMentions(context, next);

      expect(mockParseMentions).toHaveBeenCalledWith('hello @alice');
      expect(context.state.mentions).toContain('@alice');
      expect(next).toHaveBeenCalledOnce();
    });

    it('should extract mentions from mention-type entities', () => {
      const context = buildContext({
        state: {
          text: 'hi @bob',
          entities: [{ type: 'mention', value: '@bob', offset: 3, length: 4 }],
        } as any,
      });

      parseMentions(context, next);

      expect(context.state.mentions).toContain('@bob');
    });

    it('should extract username from text_mention-type entities', () => {
      const context = buildContext({
        state: {
          text: 'hi Alice',
          entities: [{ type: 'text_mention', value: { username: 'alice_user' }, offset: 3, length: 5 }],
        } as any,
      });

      parseMentions(context, next);

      expect(context.state.mentions).toContain('alice_user');
    });

    it('should use empty array fallback when no entities provided', () => {
      const context = buildContext({ state: { text: 'hello', entities: undefined } as any });

      parseMentions(context, next);

      expect(context.state.mentions).toBeDefined();
      expect(next).toHaveBeenCalledOnce();
    });

    it('should ignore entities with non-mention types', () => {
      const context = buildContext({
        state: {
          text: 'hello',
          entities: [{ type: 'url', value: 'https://x.com', offset: 0, length: 5 }],
        } as any,
      });

      parseMentions(context, next);

      expect(context.state.mentions).not.toContain('https://x.com');
    });
  });
});
