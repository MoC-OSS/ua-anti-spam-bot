import { deleteMessageTransformer } from '@bot/transformers/delete-message.transformer';

import type { GrammyContext } from '@app-types/context';

describe('deleteMessageTransformer', () => {
  describe('deleteMessage method', () => {
    it('should mark state as deleted after a successful delete request', async () => {
      const context = { state: {} } as unknown as GrammyContext;
      const transformer = deleteMessageTransformer(context);
      const previous = vi.fn().mockResolvedValue({ ok: true }) as Parameters<typeof transformer>[0];
      const payload = { chat_id: 1, message_id: 1 };

      await transformer(previous, 'deleteMessage', payload);

      expect(context.state.isDeleted).toBe(true);
      expect(previous).toHaveBeenCalledOnce();
    });

    it('should not mark state as deleted when delete request fails', async () => {
      const context = { state: {} } as unknown as GrammyContext;
      const transformer = deleteMessageTransformer(context);
      const error = new Error('delete failed');
      const previous = vi.fn().mockRejectedValue(error) as Parameters<typeof transformer>[0];
      const payload = { chat_id: 1, message_id: 1 };

      await expect(transformer(previous, 'deleteMessage', payload)).rejects.toThrow('delete failed');
      expect(context.state.isDeleted).toBeUndefined();
    });
  });

  describe('non-delete methods', () => {
    it('should not mark state as deleted for other API calls', async () => {
      const context = { state: {} } as unknown as GrammyContext;
      const transformer = deleteMessageTransformer(context);
      const previous = vi.fn().mockResolvedValue({ ok: true }) as Parameters<typeof transformer>[0];
      const payload = { chat_id: 1, text: 'test' };

      await transformer(previous, 'sendMessage', payload);

      expect(context.state.isDeleted).toBeUndefined();
      expect(previous).toHaveBeenCalledOnce();
    });
  });
});
