import type { Chat, User } from '@grammyjs/types/manage';
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
  genericUser: User = {
    ...this.genericUserAtom,
    is_bot: false,
  };

  readonly genericUser2: User = {
    ...this.genericUser2Atom,
    is_bot: false,
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
