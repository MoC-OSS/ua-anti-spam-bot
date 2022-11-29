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
export const messageQuery = getValidQueryType([':text', ':forward_date', ':poll', ':caption']);
