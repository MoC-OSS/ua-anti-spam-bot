import { SpamMediaGroupsStorage } from '@services/spam-media-groups-storage.service';

/**
 *
 * @param chatId
 * @param mediaGroupId
 */
function buildMockContext(chatId: number | undefined, mediaGroupId: string | undefined): any {
  return {
    chat: chatId === undefined ? undefined : { id: chatId },
    message: mediaGroupId === undefined ? undefined : { media_group_id: mediaGroupId },
  };
}

describe('SpamMediaGroupsStorage', () => {
  let storage: SpamMediaGroupsStorage;

  beforeEach(() => {
    vi.useFakeTimers();
    storage = new SpamMediaGroupsStorage();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('addSpamMediaGroup', () => {
    describe('positive cases', () => {
      it('should add a media group to storage', () => {
        const context = buildMockContext(-100, 'group-1');

        storage.addSpamMediaGroup(context);

        expect(storage.isSpamMediaGroup(context)).toBe(true);
      });

      it('should overwrite an existing media group entry', () => {
        const context = buildMockContext(-100, 'group-2');

        storage.addSpamMediaGroup(context);
        storage.addSpamMediaGroup(context);

        expect(storage.isSpamMediaGroup(context)).toBe(true);
      });
    });

    describe('negative cases', () => {
      it('should throw when chatId is missing', () => {
        const context = buildMockContext(undefined, 'group-1');

        expect(() => storage.addSpamMediaGroup(context)).toThrow('Invalid groupId or chatId');
      });

      it('should throw when groupId is missing', () => {
        // eslint-disable-next-line unicorn/no-useless-undefined
        const context = buildMockContext(-100, undefined);

        expect(() => storage.addSpamMediaGroup(context)).toThrow('Invalid groupId or chatId');
      });
    });
  });

  describe('isSpamMediaGroup', () => {
    describe('positive cases', () => {
      it('should return true for a registered spam media group', () => {
        const context = buildMockContext(-200, 'group-3');

        storage.addSpamMediaGroup(context);

        expect(storage.isSpamMediaGroup(context)).toBe(true);
      });
    });

    describe('negative cases', () => {
      it('should return false for an unknown group', () => {
        const context = buildMockContext(-200, 'unknown-group');

        expect(storage.isSpamMediaGroup(context)).toBe(false);
      });

      it('should throw when chatId is missing', () => {
        const context = buildMockContext(undefined, 'group-1');

        expect(() => storage.isSpamMediaGroup(context)).toThrow('Invalid groupId or chatId');
      });
    });
  });

  describe('expiration', () => {
    describe('positive cases', () => {
      it('should expire entries after 60 seconds', () => {
        const context = buildMockContext(-300, 'expiring-group');

        storage.addSpamMediaGroup(context);
        expect(storage.isSpamMediaGroup(context)).toBe(true);

        // Advance past expiration time (60s) plus check interval (10s)
        vi.advanceTimersByTime(71_000);

        expect(storage.isSpamMediaGroup(context)).toBe(false);
      });

      it('should not expire entries before 60 seconds', () => {
        const context = buildMockContext(-300, 'active-group');

        storage.addSpamMediaGroup(context);

        vi.advanceTimersByTime(30_000);

        expect(storage.isSpamMediaGroup(context)).toBe(true);
      });
    });
  });
});
