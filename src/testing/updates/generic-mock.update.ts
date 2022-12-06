import type { User } from '@grammyjs/types/manage';
import type { Update } from 'grammy/out/types';

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

  /**
   * Generic user atom used for `from` and `chat` properties
   * */
  readonly genericUserAtom = this.getValidUser({
    last_name: 'GrammyMock LastName',
    id: 1_111_111,
    first_name: 'GrammyMock FirstName',
    username: 'GrammyMock_Username',
  });

  /**
   * Generic default user
   * */
  readonly genericUser: User = {
    ...this.genericUserAtom,
    is_bot: false,
  };

  /**
   * Minimal update for the update entity
   * */
  abstract readonly minimalUpdate;

  /**
   * Actual merged update
   * */
  abstract readonly update;

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
  abstract build();

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
  abstract buildOverwrite<E extends PartialUpdate>(extra: E);
}
