import { TelegramUtility } from '@utils/telegram.util';

/**
 *
 * @param overrides
 */
function buildMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 123,
    is_bot: false,
    first_name: 'John',
    last_name: 'Doe',
    username: 'johndoe',
    ...overrides,
  };
}

/**
 *
 * @param overrides
 */
function buildMockContext(overrides: Record<string, unknown> = {}): any {
  return {
    from: buildMockUser(),
    chat: { id: -100, type: 'supergroup', title: 'Test Group' },
    getChat: vi.fn(() => Promise.resolve({ id: -100, title: 'Test Group', type: 'supergroup', invite_link: 'https://t.me/joinchat/test' })),
    api: {
      getChatAdministrators: vi.fn(() =>
        Promise.resolve([
          { status: 'creator', user: buildMockUser({ username: 'admin' }), can_promote_members: true },
          { status: 'administrator', user: buildMockUser({ id: 456, username: 'mod' }), can_promote_members: true },
        ]),
      ),
    },
    ...overrides,
  };
}

describe('TelegramUtility', () => {
  let utility: TelegramUtility;

  beforeEach(() => {
    utility = new TelegramUtility();
  });

  describe('isFromChannel', () => {
    describe('positive cases', () => {
      it('should return true when message is from Channel_Bot', () => {
        const context = buildMockContext({
          from: { first_name: 'Channel', username: 'Channel_Bot' },
        });

        expect(utility.isFromChannel(context)).toBe(true);
      });
    });

    describe('negative cases', () => {
      it('should return false for regular users', () => {
        const context = buildMockContext();

        expect(utility.isFromChannel(context)).toBe(false);
      });

      it('should return false when from is undefined', () => {
        const context = buildMockContext({ from: undefined });

        expect(utility.isFromChannel(context)).toBe(false);
      });
    });
  });

  describe('getChatTitle', () => {
    describe('positive cases', () => {
      it('should return the chat title when available', () => {
        const chat = { id: -100, type: 'supergroup', title: 'My Group' } as any;

        expect(utility.getChatTitle(chat)).toBe('My Group');
      });

      it('should return placeholder when chat has no title', () => {
        const chat = { id: 123, type: 'private' } as any;

        expect(utility.getChatTitle(chat)).toBe('$title');
      });

      it('should return placeholder when chat is undefined', () => {
        expect(utility.getChatTitle()).toBe('$title');
      });
    });
  });

  describe('getInviteLink', () => {
    describe('positive cases', () => {
      it('should return the invite link when present', () => {
        const chatInfo = { invite_link: 'https://t.me/joinchat/abc', id: -100 } as any;

        expect(utility.getInviteLink(chatInfo)).toBe('https://t.me/joinchat/abc');
      });
    });

    describe('negative cases', () => {
      it('should return undefined when invite_link is absent', () => {
        const chatInfo = { id: -100, title: 'Chat' } as any;

        expect(utility.getInviteLink(chatInfo)).toBeUndefined();
      });

      it('should return undefined when invite_link is empty string', () => {
        const chatInfo = { invite_link: '', id: -100 } as any;

        expect(utility.getInviteLink(chatInfo)).toBeUndefined();
      });
    });
  });

  describe('getUserMentionOrName', () => {
    describe('positive cases', () => {
      it('should return @username when username exists', () => {
        const user = buildMockUser() as any;

        expect(utility.getUserMentionOrName(user)).toBe('@johndoe');
      });

      it('should return full name when no username', () => {
        const user = buildMockUser({ username: undefined, first_name: 'Jane', last_name: 'Smith' }) as any;

        expect(utility.getUserMentionOrName(user)).toBe('Jane Smith');
      });

      it('should return first name only when no username and no last name', () => {
        const user = buildMockUser({ username: undefined, last_name: undefined }) as any;

        expect(utility.getUserMentionOrName(user)).toBe('John');
      });
    });
  });

  describe('getChatAdmins', () => {
    describe('positive cases', () => {
      it('should return admin info when admins exist', async () => {
        const context = buildMockContext();
        const result = await utility.getChatAdmins(context, -100);

        expect(result).toHaveProperty('creator');
        expect(result).toHaveProperty('admins');
        expect(result).toHaveProperty('adminsString');
      });

      it('should return empty object when admins array is empty', async () => {
        const context = buildMockContext({
          api: { getChatAdministrators: vi.fn(() => Promise.resolve([])) },
        });

        const result = await utility.getChatAdmins(context, -100);

        expect(result).toEqual({});
      });
    });
  });

  describe('getLogsSaveMessageParts', () => {
    describe('positive cases', () => {
      it('should return userMention and chatMention', async () => {
        const context = buildMockContext();
        const result = await utility.getLogsSaveMessageParts(context);

        expect(result).toHaveProperty('userMention');
        expect(result).toHaveProperty('chatMention');
      });

      it('should use user ID in userMention when from.id exists', async () => {
        const context = buildMockContext();
        const result = await utility.getLogsSaveMessageParts(context);

        expect(result.userMention).toContain('tg://user?id=123');
      });

      it('should include invite link in chatMention when available', async () => {
        const context = buildMockContext();
        const result = await utility.getLogsSaveMessageParts(context);

        expect(result.chatMention).toContain('https://t.me/joinchat/test');
      });
    });
  });
});
