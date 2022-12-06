import type { PartialUpdate } from './generic-mock.update';
import { GenericMockUpdate } from './generic-mock.update';

export class LeftMemberMockUpdate extends GenericMockUpdate {
  readonly minimalUpdate = GenericMockUpdate.getValidUpdate({
    update_id: this.genericUpdateId,
    message: {
      message_id: 230,
      from: this.genericUser2,
      date: this.genericSentDate,
      chat: this.genericSuperGroup,
      left_chat_member: this.genericUser,
    },
  } as const);

  build() {
    return this.minimalUpdate;
  }

  buildOverwrite<E extends PartialUpdate>(extra: E) {
    return this.deepMerge(this.minimalUpdate, extra);
  }
}
