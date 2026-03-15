import type { Chat, ChatMember } from '@grammyjs/types/manage';

import type { PartialUpdate } from './generic-mock.update';
import { GenericMockUpdate } from './generic-mock.update';

export interface MyChatMemberOptions {
  oldStatus: ChatMember['status'];
  newStatus: ChatMember['status'];
  chatType?: Chat['type'];
  canDeleteMessages?: boolean;
}

/**
 * Generates `my_chat_member` updates for testing bot invite/kick/promote/demote queries.
 */
export class MyChatMemberMockUpdate extends GenericMockUpdate {
  constructor(private readonly options: MyChatMemberOptions) {
    super();
  }

  private buildChatMember(status: ChatMember['status'], canDeleteMessages = false): ChatMember {
    switch (status) {
      case 'creator': {
        return { status: 'creator', user: this.genericUserBot, is_anonymous: false };
      }

      case 'administrator': {
        return {
          status: 'administrator',
          user: this.genericUserBot,
          is_anonymous: false,
          can_be_edited: false,
          can_manage_chat: true,
          can_change_info: true,
          can_delete_messages: canDeleteMessages,
          can_invite_users: true,
          can_restrict_members: true,
          can_promote_members: false,
          can_manage_video_chats: true,
          can_post_stories: false,
          can_edit_stories: false,
          can_delete_stories: false,
        };
      }

      case 'member': {
        return { status: 'member', user: this.genericUserBot };
      }

      case 'left': {
        return { status: 'left', user: this.genericUserBot };
      }

      case 'kicked': {
        return { status: 'kicked', user: this.genericUserBot, until_date: 0 };
      }

      case 'restricted': {
        return {
          status: 'restricted',
          user: this.genericUserBot,
          is_member: false,
          can_send_messages: false,
          can_send_audios: false,
          can_send_documents: false,
          can_send_photos: false,
          can_send_videos: false,
          can_send_video_notes: false,
          can_send_voice_notes: false,
          can_send_polls: false,
          can_send_other_messages: false,
          can_add_web_page_previews: false,
          can_change_info: false,
          can_invite_users: false,
          can_edit_tag: false,
          can_pin_messages: false,
          can_manage_topics: false,
          until_date: 0,
        };
      }

      default: {
        return { status: 'member', user: this.genericUserBot };
      }
    }
  }

  private get chat() {
    const { chatType = 'supergroup' } = this.options;

    if (chatType === 'channel') {
      return this.genericChannelChat;
    }

    if (chatType === 'group') {
      return this.genericGroupChat;
    }

    return this.genericSuperGroup;
  }

  get minimalUpdate() {
    return GenericMockUpdate.getValidUpdate({
      update_id: this.genericUpdateId,
      my_chat_member: {
        chat: this.chat,
        from: this.genericUser,
        date: this.genericSentDate,
        old_chat_member: this.buildChatMember(this.options.oldStatus),
        new_chat_member: this.buildChatMember(this.options.newStatus, this.options.canDeleteMessages),
      },
    });
  }

  build() {
    return this.minimalUpdate;
  }

  buildOverwrite<TExtra extends PartialUpdate>(extra: TExtra) {
    return this.deepMerge(this.minimalUpdate, extra);
  }
}
