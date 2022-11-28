import type { FilterQuery } from 'grammy';

/**
 * Helps to create a valid union type
 * */
export type GetValidQueryType<T extends FilterQuery> = T extends FilterQuery ? T : never;

/**
 * Required type to message query work
 * */
export type MessageQueryType = GetValidQueryType<':text' | ':forward_date' | ':poll' | ':caption'>[];

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
export const messageQuery = [':text', ':forward_date', ':poll', ':caption'] as FilterQuery[] as MessageQueryType;
