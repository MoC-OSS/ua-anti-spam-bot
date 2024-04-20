import type { Chat, ChatMemberAdministrator, ChatMemberOwner, User } from '@grammyjs/types/manage';
import deepmerge from 'deepmerge';
import type { Update } from 'grammy/out/types';
import type { MergeDeep } from 'type-fest';

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

  /**
   * Minimal update for the update entity
   * */
  abstract readonly minimalUpdate;

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract build(...parameters: any[]);

  /**
   * @returns update with extra update information to override
   *
   * @example
   * ```ts
   * buildOverwrite<E extends PartialUpdate>(extra: E) {
   *   return deepmerge(this.update, extra) as MergeDeep<typeof this.update, E>;
   * }
   * ```
   * @param parameters
   * */
  // abstract buildOverwrite<E extends PartialUpdate>(extra: E);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract buildOverwrite(...parameters: any[]);

  deepMerge<A, B>(a: A, b: B): MergeDeep<A, B> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-explicit-any
    return deepmerge(a as any, b as any);
  }
}
