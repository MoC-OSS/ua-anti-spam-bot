import { GenericMockUpdate } from './generic-mock.update';

/**
 * Get kicked bot user update
 * */
export class KickMeMockUpdate extends GenericMockUpdate {
  readonly minimalUpdate = GenericMockUpdate.getValidUpdate({
    update_id: this.genericUpdateId,
    my_chat_member: {},
    chat_member: {
      from: this.genericUser,
      date: this.genericSentDate,
      chat: this.genericSuperGroup,
      old_chat_member: {
        user: this.genericUserBot,
        status: 'administrator',
        can_be_edited: false,
        can_manage_chat: true,
        can_change_info: true,
        can_post_messages: true,
        can_edit_messages: true,
        can_delete_messages: true,
        can_invite_users: true,
        can_restrict_members: true,
        can_promote_members: false,
        can_manage_video_chats: true,
        is_anonymous: false,
      },
      new_chat_member: {
        user: this.genericUserBot,
        status: 'left',
      },
    },
  } as const);
}
