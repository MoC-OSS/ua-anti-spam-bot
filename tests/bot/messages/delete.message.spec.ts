import {
  getAdminReadyMessage,
  getCannotDeleteMessage,
  getDeleteCounteroffensiveMessage,
  getDeleteFeatureMessage,
  getDeleteMessage,
  getDeleteNsfwMessage,
} from '@bot/messages/delete.message';

import type { GrammyContext } from '@app-types/context';

const createMockContext = (): GrammyContext =>
  ({
    t: vi.fn((key: string, parameters?: Record<string, unknown>) => {
      if (parameters) {
        return `${key}:${JSON.stringify(parameters)}`;
      }

      return key;
    }),
  }) as unknown as GrammyContext;

describe('delete.message', () => {
  describe('getAdminReadyMessage', () => {
    describe('positive cases', () => {
      it('should return admin ready message with bot name', () => {
        const context = createMockContext();
        const result = getAdminReadyMessage(context, { botName: 'MyBot' });

        expect(result).toContain('bot-admin-ready');
        expect(result).toContain('MyBot');
      });
    });
  });

  describe('getDeleteMessage', () => {
    describe('positive cases', () => {
      it('should return message with userId and writeUsername', () => {
        const context = createMockContext();

        const result = getDeleteMessage(context, {
          writeUsername: '@user',
          userId: 12_345,
          wordMessage: 'test word',
          debugMessage: '',
          withLocation: false,
        });

        expect(result).toContain('delete-user-atom-with-user');
        expect(result).toContain('delete-strategic-reason');
      });

      it('should return message without userId', () => {
        const context = createMockContext();

        const result = getDeleteMessage(context, {
          writeUsername: '',
          userId: undefined,
          wordMessage: 'test word',
          debugMessage: '',
        });

        expect(result).toContain('delete-user-atom-no-user');
      });

      it('should use location reason when withLocation is true', () => {
        const context = createMockContext();

        const result = getDeleteMessage(context, {
          writeUsername: '@user',
          userId: 12_345,
          wordMessage: 'location word',
          debugMessage: '',
          withLocation: true,
        });

        expect(result).toContain('delete-strategic-reason-location');
      });

      it('should include debug message when provided', () => {
        const context = createMockContext();

        const result = getDeleteMessage(context, {
          writeUsername: '@user',
          userId: 12_345,
          wordMessage: '',
          debugMessage: 'debug info here',
        });

        expect(result).toContain('debug info here');
      });
    });
  });

  describe('getDeleteFeatureMessage', () => {
    describe('positive cases', () => {
      it('should return message with userId and writeUsername', () => {
        const context = createMockContext();

        const result = getDeleteFeatureMessage(context, {
          writeUsername: '@user',
          userId: 12_345,
          featuresString: 'spam links',
        });

        expect(result).toContain('delete-user-atom-with-user');
        expect(result).toContain('delete-feature-message');
      });
    });

    describe('negative cases', () => {
      it('should return message without userId (anonymous user)', () => {
        const context = createMockContext();

        const result = getDeleteFeatureMessage(context, {
          writeUsername: '',
          userId: undefined,
          featuresString: 'spam',
        });

        expect(result).toContain('delete-user-atom-no-user');
      });
    });
  });

  describe('getDeleteNsfwMessage', () => {
    describe('positive cases', () => {
      it('should return message with userId and writeUsername', () => {
        const context = createMockContext();

        const result = getDeleteNsfwMessage(context, {
          writeUsername: '@user',
          userId: 12_345,
        });

        expect(result).toContain('delete-user-atom-with-user');
        expect(result).toContain('delete-nsfw-message');
      });
    });

    describe('negative cases', () => {
      it('should return message without userId', () => {
        const context = createMockContext();

        const result = getDeleteNsfwMessage(context, {
          writeUsername: '',
          userId: undefined,
        });

        expect(result).toContain('delete-user-atom-no-user');
      });
    });
  });

  describe('getDeleteCounteroffensiveMessage', () => {
    describe('positive cases', () => {
      it('should return message with userId and writeUsername', () => {
        const context = createMockContext();

        const result = getDeleteCounteroffensiveMessage(context, {
          writeUsername: '@user',
          userId: 12_345,
        });

        expect(result).toContain('delete-user-atom-with-user');
        expect(result).toContain('delete-counteroffensive-message');
      });
    });

    describe('negative cases', () => {
      it('should return message without userId', () => {
        const context = createMockContext();

        const result = getDeleteCounteroffensiveMessage(context, {
          writeUsername: '',
          userId: undefined,
        });

        expect(result).toContain('delete-user-atom-no-user');
      });
    });
  });

  describe('getCannotDeleteMessage', () => {
    describe('positive cases', () => {
      it('should return message with adminsString', () => {
        const context = createMockContext();
        const result = getCannotDeleteMessage(context, { adminsString: '@admin1, @admin2' });

        expect(result).toContain('cannot-delete-message');
        expect(result).toContain('@admin1');
      });
    });

    describe('negative cases', () => {
      it('should return message with fallback "none" when no adminsString', () => {
        const context = createMockContext();
        const result = getCannotDeleteMessage(context, {});

        expect(result).toContain('cannot-delete-message');
        expect(result).toContain('none');
      });
    });
  });
});
