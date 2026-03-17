import { getDeleteAntisemitismMessage } from '@bot/messages/antisemitism.message';
import { getDeleteDenylistMessage } from '@bot/messages/denylist.message';

import type { GrammyContext } from '@app-types/context';

/**
 *
 * @param tFunction
 */
function buildContext(tFunction?: (key: string, parameters?: unknown) => string): GrammyContext {
  return {
    t: tFunction ?? ((key: string, parameters?: unknown) => (parameters ? `${key}:${JSON.stringify(parameters)}` : key)),
  } as unknown as GrammyContext;
}

describe('getDeleteAntisemitismMessage', () => {
  describe('with userId and writeUsername', () => {
    it('should include user atom with user info', () => {
      const context = buildContext();
      const result = getDeleteAntisemitismMessage(context, { userId: 1, writeUsername: 'alice', word: 'testword' });

      expect(result).toContain('delete-user-atom-with-user');
      expect(result).toContain('delete-antisemitism-by-word');
    });
  });

  describe('without userId or writeUsername', () => {
    it('should use no-user atom when userId is missing', () => {
      const context = buildContext();
      const result = getDeleteAntisemitismMessage(context, { userId: undefined, writeUsername: 'someone', word: 'testword' });

      expect(result).toContain('delete-user-atom-no-user');
      expect(result).toContain('delete-antisemitism-by-word');
    });
  });
});

describe('getDeleteDenylistMessage', () => {
  describe('with userId and writeUsername', () => {
    it('should include user atom with user info', () => {
      const context = buildContext();
      const result = getDeleteDenylistMessage(context, { userId: 2, writeUsername: 'bob', word: 'badword' });

      expect(result).toContain('delete-user-atom-with-user');
      expect(result).toContain('delete-denylist-by-word');
    });
  });

  describe('without userId or writeUsername', () => {
    it('should use no-user atom when userId is missing', () => {
      const context = buildContext();
      const result = getDeleteDenylistMessage(context, { userId: undefined, writeUsername: 'someone', word: 'badword' });

      expect(result).toContain('delete-user-atom-no-user');
      expect(result).toContain('delete-denylist-by-word');
    });
  });
});
