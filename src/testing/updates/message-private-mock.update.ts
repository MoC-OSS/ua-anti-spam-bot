import deepmerge from 'deepmerge';
import type { MergeDeep } from 'type-fest';

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
      chat: {
        type: 'private',
        ...this.genericUserAtom,
      },
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
    return deepmerge(this.update, extra) as MergeDeep<typeof this.update, E>;
  }
}
