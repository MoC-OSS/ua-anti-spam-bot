import type { Chat, ChatMemberAdministrator, ChatMemberOwner, User } from '@grammyjs/types/manage';
import deepmerge from 'deepmerge';
import type { Update } from 'grammy/out/types';
import type { MergeDeep } from 'type-fest';
import type { ChatMemberMember } from 'typegram';

export type PartialUpdate<U extends Update = Update> = Partial<{
  [key in keyof U]: Partial<U[key]>;
}>;

/**
 * Mock update abstract class to extend.
 * Offers all main fields to declare
 * */
export abstract class GenericMockUpdate {
  readonly genericUpdateId = 10_000;

  readonly genericSentDate = Date.now() / 1000;

  readonly genericSuperGroup: Chat.SupergroupChat = {
    type: 'supergroup',
    id: 202_212,
    title: 'GrammyMock',
  };

  readonly genericChannelChat: Chat.ChannelChat = {
    type: 'channel',
    id: 202_212,
    title: 'GrammyMockChannel',
  };

  readonly genericGroupChat: Chat.GroupChat = {
    type: 'group',
    id: 303_303,
    title: 'GrammyMockGroup',
  };

  readonly genericUserBot = this.getValidUser({
    id: 2022,
    is_bot: true,
    first_name: 'GrammyMock BotFirstName',
    last_name: 'GrammyMock BotLastName',
    username: 'GrammyMock_bot',
  });

  /**
   * Generic user atom used for `from` and `chat` properties
   * */
  readonly genericUserAtom = this.getValidUser({
    last_name: 'GrammyMock LastName',
    id: 1_111_111,
    first_name: 'GrammyMock FirstName',
    username: 'GrammyMock_Username',
  });

  readonly genericUser2Atom = this.getValidUser({
    last_name: 'GrammyMock LastName2',
    id: 1_111_112,
    first_name: 'GrammyMock FirstName2',
    username: 'GrammyMock_Username2',
  });

  /**
   * Generic default user
   * */
  readonly genericUser: User = {
    ...this.genericUserAtom,
    is_bot: false,
  };

  readonly genericUser2: User = {
    ...this.genericUser2Atom,
    is_bot: false,
  };

  readonly genericPrivateChat: Chat.PrivateChat = {
    type: 'private',
    ...this.genericUserAtom,
  };

  readonly genericOwner: ChatMemberOwner = {
    status: 'creator',
    user: this.genericUser,
    custom_title: 'Super Creator Title',
    is_anonymous: false,
  };

  readonly genericAdmin: ChatMemberAdministrator = {
    status: 'administrator',
    user: this.genericUser2,
    custom_title: 'Super Admin Title',
    is_anonymous: true,
    can_be_edited: true,
    can_change_info: true,
    can_delete_messages: true,
    can_edit_messages: true,
    can_invite_users: true,
    can_manage_chat: true,
    can_manage_video_chats: true,
    can_promote_members: true,
    can_restrict_members: true,
  };

  readonly genericUserMember: ChatMemberMember = {
    status: 'member',
    user: this.genericUser,
  };

  readonly genericMessagePartial = {
    message_id: 12_345, // Example message_id generation
    date: Math.floor(Date.now() / 1000), // Current date in Unix timestamp
  };

  // todo setUserType method, now telegram doesn't have interface for User type in message
  // setUserType(userType: ChatMember['status']) {
  //   const members: Partial<Record<ChatMember['status'], ChatMember>> = {
  //     creator: this.genericOwner,
  //     administrator: this.genericAdmin,
  //     member: this.genericUserMember,
  //   };
  //   const currenMember = members[userType];
  //   if (currenMember) {
  //     // const userStruct = this.deepMerge({ message: this.genericMessagePartial }, { message: { from: { user: currenMember } } });
  //     this.minimalUpdate = this.deepMerge(
  //       this.minimalUpdate,
  //       GenericMockUpdate.getValidUpdate({message:{fro}),
  //     );
  //   }
  //   GenericMockUpdate.getValidUpdate({ message: { from: { user: currenMember } } }),
  //   if (userType === 'owner') {
  //     userUpdate = { message: { from: this.genericOwner } };
  //   } else if (userType === 'admin') {
  //     userUpdate = { message: { from: this.genericAdmin } };
  //   }
  //   this.minimalUpdate = this.deepMerge(this.minimalUpdate, GenericMockUpdate.getValidUpdate(userUpdate));
  //   return this; // Return this for chaining
  // }
  setChatType(chatType: Chat['type']) {
    const chatUpdates: Partial<Record<Chat['type'], Chat>> = {
      private: this.genericPrivateChat,
      group: this.genericGroupChat,
      channel: this.genericChannelChat,
    };
    const chatUpdate = chatUpdates[chatType];
    if (chatUpdate) {
      const messageStruct = this.deepMerge({ message: this.genericMessagePartial }, { message: { chat: chatUpdate } });
      this.minimalUpdate = this.deepMerge(this.minimalUpdate, GenericMockUpdate.getValidUpdate(messageStruct));
    }

    return this; // Return this for chaining
  }

  /**
   * Minimal update for the update entity
   * */
  abstract minimalUpdate: Partial<Update>;

  /**
   * @param update - update to type
   * @returns typed but strict object value type
   * */
  static getValidUpdate<U extends PartialUpdate>(update: U): U {
    return update;
  }

  /**
   * @param user - user to type
   * @returns typed but strict object value type
   * */
  getValidUser<U extends Partial<User>>(user: U): U {
    return user;
  }

  /**
   * @returns regular actual merged update
   *
   * @example
   * ```ts
   * build() {
   *   return this.update;
   * }
   * ```
   * */
  abstract build(...parameters: any[]);

  /**
   * @param extra - addition to add
   * @returns update with extra update information to override
   *
   * @example
   * ```ts
   * buildOverwrite<E extends PartialUpdate>(extra: E) {
   *   return deepmerge(this.update, extra) as MergeDeep<typeof this.update, E>;
   * }
   * ```
   * */
  // abstract buildOverwrite<E extends PartialUpdate>(extra: E);

  abstract buildOverwrite(...parameters: any[]);

  deepMerge<A, B>(a: A, b: B): MergeDeep<A, B> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return deepmerge(a as any, b as any);
  }
}
