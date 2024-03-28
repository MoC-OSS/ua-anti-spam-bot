import type { Chat, User } from '@grammyjs/types/manage';

import type { PartialUpdate } from './generic-mock.update';
import { GenericMockUpdate } from './generic-mock.update';

export class NewMemberMockUpdate extends GenericMockUpdate {
  readonly minimalUpdate = GenericMockUpdate.getValidUpdate({
    update_id: this.genericUpdateId,
    message: {
      message_id: 230,
      from: this.genericUser2,
      date: this.genericSentDate,
      chat: this.genericSuperGroup as Chat,
      new_chat_members: [this.genericUser] as User[],
    },
  });

  build() {
    return this.minimalUpdate;
  }

  buildOverwrite<E extends PartialUpdate>(extra: E) {
    return this.deepMerge(this.minimalUpdate, extra);
  }
}
