import type { NextFunction } from 'grammy';

import { parseUrls } from '@bot/middleware/parse-urls.middleware';

import type { GrammyContext } from '@app-types/context';

const { mockParseUrls } = vi.hoisted(() => ({
  mockParseUrls: vi.fn().mockReturnValue([]),
}));

vi.mock('@services/url.service', () => ({
  urlService: { parseUrls: mockParseUrls },
}));

vi.mock('@utils/remove-duplicates.util', () => ({
  removeDuplicates: (array: unknown[]) => array,
}));

function buildContext(overrides: Partial<GrammyContext> = {}): GrammyContext {
  return {
    state: {},
    ...overrides,
  } as unknown as GrammyContext;
}

describe('parseUrls', () => {
  let next: NextFunction;

  beforeEach(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    next = vi.fn().mockResolvedValue(undefined);
    vi.clearAllMocks();
    mockParseUrls.mockReturnValue([]);
  });

  describe('when text is absent or urls already set', () => {
    it('should skip parsing when state has no text', () => {
      const context = buildContext({ state: {} as any });

      parseUrls(context, next);

      expect(mockParseUrls).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });

    it('should skip parsing when state.urls is already set', () => {
      const context = buildContext({ state: { text: 'hello', urls: ['existing'] } as any });

      parseUrls(context, next);

      expect(mockParseUrls).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe('when text is present and urls not yet set', () => {
    it('should parse urls from text and set state.urls', () => {
      mockParseUrls.mockReturnValue(['https://example.com']);
      const context = buildContext({ state: { text: 'visit https://example.com' } as any });

      parseUrls(context, next);

      expect(mockParseUrls).toHaveBeenCalledWith('visit https://example.com', true);
      expect(context.state.urls).toContain('https://example.com');
      expect(next).toHaveBeenCalledOnce();
    });

    it('should extract urls from url-type entities', () => {
      const context = buildContext({
        state: {
          text: 'hello',
          entities: [{ type: 'url', value: 'https://entity.com', offset: 0, length: 5 }],
        } as any,
      });

      parseUrls(context, next);

      expect(context.state.urls).toContain('https://entity.com');
    });

    it('should extract urls from text_link-type entities', () => {
      const context = buildContext({
        state: {
          text: 'hello',
          entities: [{ type: 'text_link', value: 'https://link.com', offset: 0, length: 5 }],
        } as any,
      });

      parseUrls(context, next);

      expect(context.state.urls).toContain('https://link.com');
    });

    it('should ignore non-url entities and use empty array fallback when no entities', () => {
      const context = buildContext({ state: { text: 'hello', entities: undefined } as any });

      parseUrls(context, next);

      expect(context.state.urls).toBeDefined();
      expect(next).toHaveBeenCalledOnce();
    });

    it('should ignore entities with other types', () => {
      const context = buildContext({
        state: {
          text: 'hello @user',
          entities: [{ type: 'mention', value: '@user', offset: 6, length: 5 }],
        } as any,
      });

      parseUrls(context, next);

      expect(context.state.urls).not.toContain('@user');
    });
  });
});
