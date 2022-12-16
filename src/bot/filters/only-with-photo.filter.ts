import type { GrammyFilter } from '../../types';

/**
 * Checks that state has photo
 * */
export const onlyWithPhotoFilter: GrammyFilter = (context) => !!context.state.photo;
