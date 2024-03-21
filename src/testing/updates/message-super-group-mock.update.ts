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

  public update = deepmerge(this.minimalUpdate, this.paramsUpdate);

  constructor(private text: string) {
    super();
  }

  setUserAsAdmin() {
    const userUpdate = {
      message: {
        from: this.genericAdmin,
      },
    };
    this.update = deepmerge(this.update, userUpdate);
    return this;
  }

  build() {
    return this.update;
  }

  buildOverwrite<E extends PartialUpdate>(extra: E) {
    return this.deepMerge(this.update, extra);
  }
}
