import type { Context } from 'grammy';

export type AtLeastOneArgument<T> = [T, ...T[]];

export type BooleanFilter<TContext extends Context> = (context: TContext) => boolean;

export type ChainFilter<TContext extends Context> = BooleanFilter<TContext> | Record<string, BooleanFilter<TContext> | boolean> | boolean;

/**
 * It helps to chain filters to simplify Grammy Composer's `filter` method logic.
 * @param filters
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
 */
export function chainFilters<TContext extends Context>(...filters: AtLeastOneArgument<ChainFilter<TContext>>) {
  return (context: TContext): boolean => {
    for (const filter of filters) {
      // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
      switch (typeof filter) {
        /**
         * Raw boolean value
         */
        case 'boolean': {
          if (!filter) {
            return false;
          }

          break;
        }

        /**
         * Object that has booleans
         */
        case 'object': {
          return !Object.values(filter).some((value) => (typeof value === 'function' ? !value(context) : !value));
        }

        /**
         * Function that returns boolean
         */
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
