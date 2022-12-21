import deepmerge from 'deepmerge';

import type { PartialUpdate } from './generic-mock.update';
import { GenericMockUpdate } from './generic-mock.update';

/**
 * Get super group message update
 * */
export class MessageSuperGroupMockUpdate extends GenericMockUpdate {
  readonly minimalUpdate = GenericMockUpdate.getValidUpdate({
    update_id: this.genericUpdateId,
    message: {
      date: this.genericSentDate,
      chat: this.genericSuperGroup,
      message_id: 1365,
      from: this.genericUser,
    },
  } as const);

  readonly paramsUpdate = GenericMockUpdate.getValidUpdate({
    message: {
      text: this.text,
    },
  });

  readonly update = deepmerge(this.minimalUpdate, this.paramsUpdate);

  constructor(private text: string) {
    super();
  }

  build() {
    return this.update;
  }

  buildOverwrite<E extends PartialUpdate>(extra: E) {
    return this.deepMerge(this.update, extra);
  }
}
