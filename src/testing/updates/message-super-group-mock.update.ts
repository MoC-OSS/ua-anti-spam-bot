import deepmerge from 'deepmerge';

import type { PartialUpdate } from './generic-mock.update';
import { GenericMockUpdate } from './generic-mock.update';

export class MessageMockUpdate extends GenericMockUpdate {
  readonly minimalUpdate = GenericMockUpdate.getValidUpdate({
    update_id: this.genericUpdateId,
    message: {
      date: this.genericSentDate,
      chat: this.genericSuperGroup,
      message_id: 1365,
      from: this.genericUser,
      text: this.text,
    },
  });

  constructor(private text: string) {
    super();
  }

  build() {
    return this.minimalUpdate;
  }

  buildOverwrite<E extends PartialUpdate>(extra: E): object {
    return deepmerge(this.minimalUpdate, extra);
  }
}
