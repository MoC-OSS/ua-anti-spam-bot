import type { ChatMember, ChatMemberUpdated } from '@grammyjs/types/manage';

import type { PartialUpdate } from './generic-mock.update';
import { GenericMockUpdate } from './generic-mock.update';

export type ChatMemberType = keyof Pick<ChatMemberUpdated, 'new_chat_member' | 'old_chat_member'>;

/**
 * Get chat member update
 * */
export class ChatMemberMockUpdate extends GenericMockUpdate {
  readonly minimalUpdate = GenericMockUpdate.getValidUpdate({
    update_id: this.genericUpdateId,
    chat_member: {
      from: this.genericUser,
      date: this.genericSentDate,
      chat: this.genericSuperGroup,
    },
  } as const);

  readonly positiveChatMember: ChatMember = {
    status: 'member',
    user: this.genericUser,
  };

  readonly negativeChatMember: ChatMember = {
    status: 'left',
    user: this.genericUser,
  };

  readonly newChatMember = this.deepMerge(
    this.minimalUpdate,
    GenericMockUpdate.getValidUpdate({
      chat_member: { new_chat_member: this.positiveChatMember, old_chat_member: this.negativeChatMember },
    }),
  );

  readonly oldChatMember = this.deepMerge(
    this.minimalUpdate,
    GenericMockUpdate.getValidUpdate({
      chat_member: { new_chat_member: this.negativeChatMember, old_chat_member: this.positiveChatMember },
    }),
  );

  build(type: ChatMemberType) {
    switch (type) {
      case 'new_chat_member': {
        return this.newChatMember;
      }

      case 'old_chat_member': {
        return this.oldChatMember;
      }

      default: {
        throw new Error('Invalid type specified');
      }
    }
  }

  buildOverwrite<E extends PartialUpdate>(type: ChatMemberType, extra: E) {
    return this.deepMerge(this.build(type), extra);
  }
}
