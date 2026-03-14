import type { GrammyFilter } from '@app-types/context';

/**
 * Checks that state has photo
 * */
export const onlyWithPhotoFilter: GrammyFilter = (context) => !!context.state.photo;
