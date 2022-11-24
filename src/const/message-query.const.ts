import type { FilterQuery } from 'grammy/out/filter';

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
export const messageQuery: FilterQuery | FilterQuery[] = [':text', ':forward_date', ':poll', ':caption'];
