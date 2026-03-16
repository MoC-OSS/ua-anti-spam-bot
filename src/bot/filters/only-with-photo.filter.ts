import type { GrammyFilter } from '@app-types/context';

/**
 * Checks that state has photo.
 * @param context - The Grammy context object
 * @returns True if the context state contains a photo, false otherwise
 */
export const onlyWithPhotoFilter: GrammyFilter = (context) => !!context.state.photo;
