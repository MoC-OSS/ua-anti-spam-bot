import type { PartialUpdate } from './generic-mock.update';
import { GenericMockUpdate } from './generic-mock.update';

export class MessageMockUpdate extends GenericMockUpdate {
  constructor(private readonly text: string) {
    super();
  }

  get minimalUpdate() {
    return GenericMockUpdate.getValidUpdate({
      update_id: this.genericUpdateId,
      message: {
        date: this.genericSentDate,
        chat: this.genericSuperGroup,
        message_id: 1365,
        from: this.genericUser,
        text: this.text,
      },
    });
  }

  build() {
    return this.minimalUpdate;
  }

  buildOverwrite<E extends PartialUpdate>(extra: E) {
    return this.deepMerge(this.minimalUpdate, extra);
  }
}
