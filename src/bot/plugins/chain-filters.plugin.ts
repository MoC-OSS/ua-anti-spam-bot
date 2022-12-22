import type { Context } from 'grammy';

export type AtLeastOneArgument<T> = [T, ...T[]];

export type BooleanFilter<C extends Context> = (context: C) => boolean;
export type ChainFilter<C extends Context> = boolean | BooleanFilter<C> | Record<string, boolean | BooleanFilter<C>>;

/**
 * It helps to chain filters to simplify Grammy Composer's `filter` method logic.
 *
 * @example
 * ```ts
 * composer
 *     .filter((context) =>
 *       chainFilters({
 *         isCreator: context.chat.id === creatorId,
 *         isHaveDeleteReason: !!context.state.dataset || !!context.state.swindlersResult || !!context.state.nsfwResult,
 *       })(context),
 *     )
 * ```
 * */
export function chainFilters<C extends Context>(...filters: AtLeastOneArgument<ChainFilter<C>>) {
  return (context: C): boolean => {
    // eslint-disable-next-line no-restricted-syntax
    for (const filter of filters) {
      switch (typeof filter) {
        /**
         * Raw boolean value
         * */
        case 'boolean': {
          if (!filter) {
            return false;
          }

          break;
        }

        /**
         * Object that has booleans
         * */
        case 'object': {
          return !Object.values(filter).some((value) => (typeof value === 'function' ? !value(context) : !value));
        }

        /**
         * Function that returns boolean
         * */
        case 'function': {
          if (!filter(context)) {
            return false;
          }

          break;
        }

        default: {
          throw new Error(`Unknown type has been passed. Type is ${typeof filter}`);
        }
      }
    }

    return true;
  };
}
