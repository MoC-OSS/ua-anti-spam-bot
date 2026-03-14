import deepmerge from 'deepmerge';

import type { PartialUpdate } from './generic-mock.update';
import { GenericMockUpdate } from './generic-mock.update';

/**
 * Get private message update
 * */
export class MessagePrivateMockUpdate extends GenericMockUpdate {
  readonly minimalUpdate = GenericMockUpdate.getValidUpdate({
    update_id: this.genericUpdateId,
    message: {
      date: this.genericSentDate,
      chat: this.genericPrivateChat,
      message_id: 1365,
      from: this.genericUser,
    },
  } as const);

  constructor(private readonly text: string) {
    super();
  }

  private buildUpdate() {
    const parametersUpdate = GenericMockUpdate.getValidUpdate({
      message: {
        text: this.text,
      },
    });

    return deepmerge(this.minimalUpdate, parametersUpdate);
  }

  build() {
    return this.buildUpdate();
  }

  buildOverwrite<E extends PartialUpdate>(extra: E) {
    return this.deepMerge(this.buildUpdate(), extra);
  }
}
