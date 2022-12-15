import { MessagePrivateMockUpdate } from './message-private-mock.update';

describe('Testing Update Mocks', () => {
  describe('MessagePrivateMockUpdate', () => {
    it('should create when regular build and work with typing', () => {
      const expectedText = 'test';
      const update = new MessagePrivateMockUpdate(expectedText).build();
      const isTypingWorks = update.message.chat.type === 'private';

      expect(isTypingWorks).toEqual(true);
      expect(update.message.text).toEqual(expectedText);
    });

    it('should create extended when buildOverwrite and work with typing', () => {
      const expectedText = 'test';
      const update = new MessagePrivateMockUpdate(expectedText).buildOverwrite({
        message: {
          chat: {
            type: 'group',
            id: 234,
            title: 'GrammyMock GroupTitle',
          },
        },
      } as const);

      const isTypingWorks = update.message.chat.type === 'group';

      expect(isTypingWorks).toEqual(true);
      expect(update.message.text).toEqual(expectedText);
    });
  });
});
