import type { FilterQuery } from 'grammy';

/**
 * Returns a valid tuple type for query.
 * It returns the same type that has been passed but types it
 * */
export const getValidQueryType = <T extends FilterQuery[]>(value: T): T => value;

/**
 * @description
 * Query all:
 *   regular messages
 *   edited messages
 *   forwarded messages
 *   channel messages - we need to exclude it for anti-spam logic
 *     caption messages - image with text (caption)
 *     polls
 *
 * @use isNotChannel to exclude channels for this query
 * */
export const messageQuery = getValidQueryType([
  ':text',
  ':forward_origin',
  ':poll',
  ':caption',
  // You need to add it explicitly because it won't work with omit values.
  // It could be a bug in this specific grammy version so we need to try to update it later and check if it works without it.
  // It works with unit tests but doesn't work in real bot so we need to check it in real telegram.
  // DO NOT REMOVE!
  'edited_message:text',
  'edited_message:forward_origin',
  'edited_message:poll',
  'edited_message:caption',
]);
