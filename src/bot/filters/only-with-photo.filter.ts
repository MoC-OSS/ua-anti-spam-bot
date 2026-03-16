import type { GrammyFilter } from '@app-types/context';

/**
 * Checks that state has photo
 * @param context
 */
export const onlyWithPhotoFilter: GrammyFilter = (context) => !!context.state.photo;
