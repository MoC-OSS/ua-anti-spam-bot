/**
 * @module redis.service
 * @description Application-level Redis operations for managing sessions, statistics,
 * chat settings, and swindler data persistence.
 */

import * as redisClient from '@db/redis.client';

import type { ChatSession, ChatSessionData, ChatSettings, Session } from '@app-types/session';

import { logger } from '@utils/logger.util';
import { removeDuplicates } from '@utils/remove-duplicates.util';

export interface RedisServiceSetSwindlersStatisticStatistic {
  [key: string]: string[];
}

export class RedisService {
  redisClient = redisClient;

  redisSelectors = redisClient.redisSelectors;

  /**
   * Retrieves the training chat whitelist from Redis.
   * @returns array of whitelisted chat ID strings
   */
  async getTrainingChatWhitelist() {
    return (await redisClient.getRawValue<string[]>(this.redisSelectors.trainingChatWhitelist)) || [];
  }

  /**
   * Retrieves the list of training bots from Redis.
   * @returns array of training bot name strings
   */
  async getTrainingBots() {
    return (await redisClient.getRawValue<string[]>(this.redisSelectors.trainingBots)) || [];
  }

  /**
   * Sets the training chat whitelist in Redis.
   * @param newChatIds - comma-separated string of chat IDs to set as the whitelist
   * @returns promise resolving when the value is stored
   */
  setTrainingChatWhitelist(newChatIds: string) {
    return redisClient.setRawValue(this.redisSelectors.trainingChatWhitelist, newChatIds.replaceAll(' ', '').split(','));
  }

  /**
   * Adds a chat ID to the training whitelist in Redis.
   * @param newChatId - chat ID string to append to the whitelist
   * @returns promise resolving when the updated whitelist is stored
   */
  async updateTrainingChatWhitelist(newChatId: string) {
    const currentChats = await this.getTrainingChatWhitelist();

    currentChats.push(newChatId);

    return this.setTrainingChatWhitelist(currentChats.join(','));
  }

  setTrainingBots(bots: string[]) {
    return redisClient.setRawValue(this.redisSelectors.trainingBots, bots);
  }

  async updateTrainingBots(bots: string[]) {
    const currentBots = await this.getTrainingBots();
    const newBots = removeDuplicates([...currentBots, ...bots]);

    return this.setTrainingBots(newBots);
  }

  /**
   * Retrieves the current training start rank from Redis.
   * @returns promise resolving to the training start rank number, or null if not set
   */
  getTrainingStartRank() {
    return redisClient.getRawValue<number>(this.redisSelectors.trainingStartRank);
  }

  /**
   * Sets the training start rank in Redis.
   * @param newValue - numeric rank value to store
   * @returns promise resolving when stored, or undefined if value is invalid
   */
  setTrainingStartRank(newValue: number) {
    if (newValue && +newValue) {
      return redisClient.setRawValue(this.redisSelectors.trainingStartRank, newValue);
    }

    logger.error(`setBotTensorPercent error: ${newValue} is not a number`);

    // eslint-disable-next-line unicorn/no-useless-undefined
    return undefined;
  }

  /**
   * Retrieves the bot tensor spam threshold percentage from Redis.
   * @returns promise resolving to the tensor threshold percentage, or null if not set
   */
  getBotTensorPercent() {
    return redisClient.getRawValue<number>(this.redisSelectors.botTensorPercent);
  }

  /**
   * Sets the bot tensor spam threshold percentage in Redis.
   * @param newValue - numeric percentage value to store as the threshold
   * @returns promise resolving when stored, or undefined if value is invalid
   */
  setBotTensorPercent(newValue: number) {
    if (newValue && +newValue) {
      return redisClient.setRawValue(this.redisSelectors.botTensorPercent, newValue);
    }

    logger.error(`setBotTensorPercent error: ${newValue} is not a number`);

    // eslint-disable-next-line unicorn/no-useless-undefined
    return undefined;
  }

  /**
   * Retrieves the bot deactivation status from Redis.
   * @returns promise resolving to the boolean deactivation status, or null if not set
   */
  getIsBotDeactivated() {
    return redisClient.getRawValue<boolean>(this.redisSelectors.isBotDeactivated);
  }

  /**
   * Sets the bot deactivation status in Redis.
   * @param newValue - boolean flag indicating whether the bot should be deactivated
   * @returns promise resolving when the value is stored
   */
  setIsBotDeactivated(newValue: boolean) {
    return redisClient.setRawValue(this.redisSelectors.isBotDeactivated, newValue);
  }

  /**
   * Retrieves the list of negative training words from Redis.
   * @returns promise resolving to array of negative training words
   */
  async getNegatives() {
    return (await redisClient.getRawValue<string[]>(this.redisSelectors.negatives)) || [];
  }

  /**
   * Retrieves the list of positive training words from Redis.
   * @returns promise resolving to array of positive training words
   */
  async getPositives() {
    return (await redisClient.getRawValue<string[]>(this.redisSelectors.positives)) || [];
  }

  /**
   * Appends a word to the negative training words list in Redis.
   * @param word - word to add to the negative training list
   * @returns promise resolving when the updated list is stored
   */
  async updateNegatives(word: string) {
    const words = await this.getNegatives();

    words.push(word);

    return redisClient.setRawValue(this.redisSelectors.negatives, words);
  }

  /**
   * Appends a word to the positive training words list in Redis.
   * @param word - word to add to the positive training list
   * @returns promise resolving when the updated list is stored
   */
  async updatePositives(word: string) {
    const words = await this.getPositives();

    words.push(word);

    return redisClient.setRawValue(this.redisSelectors.positives, words);
  }

  deleteNegatives() {
    return redisClient.removeKey(this.redisSelectors.negatives);
  }

  deletePositives() {
    return redisClient.removeKey(this.redisSelectors.positives);
  }

  /**
   * Merges new session data into an existing chat session in Redis.
   * @param chatId - numeric or string chat identifier
   * @param newSession - partial session data to merge into the existing session
   * @returns promise resolving when the updated session is stored
   */
  async updateChatSession(chatId: number | string, newSession: Partial<ChatSessionData>) {
    const stringChatId = chatId.toString();

    if (!this.redisSelectors.chatSessions.test(stringChatId)) {
      throw new Error(`This is an invalid chat id: ${stringChatId}`);
    }

    const currentSession = await redisClient.getRawValue<ChatSessionData>(stringChatId);

    const writeSession = {
      ...currentSession,
      ...newSession,
    } as ChatSessionData;

    return redisClient.setRawValue(stringChatId, writeSession as any);
  }

  async updateChatSettings(chatId: number | string, newSettings: ChatSettings) {
    const stringChatId = chatId.toString();

    if (!this.redisSelectors.chatSessions.test(stringChatId)) {
      throw new Error(`This is an invalid chat id: ${stringChatId}`);
    }

    const currentSession = await redisClient.getRawValue<ChatSessionData>(stringChatId);

    const updatedSession = {
      ...currentSession,
      chatSettings: newSettings,
    } as ChatSessionData;

    return redisClient.setRawValue(stringChatId, updatedSession);
  }

  async getUserSessions(): Promise<Session[]> {
    return redisClient.getAllUserRecords();
  }

  async getUserSession(userId: string) {
    const key = `${userId}:${userId}`;

    return redisClient.getRawValue<Session>(key);
  }

  async setUserSession(userId: string, session: Session) {
    const key = `${userId}:${userId}`;

    return redisClient.setRawValue(key, session);
  }

  async getChatSessions(): Promise<ChatSession[]> {
    return redisClient.getAllChatRecords();
  }

  /**
   * Retrieves the session data for a specific chat from Redis.
   * @param chatId - numeric or string chat identifier
   * @returns promise resolving to the ChatSessionData object, or null if not found
   */
  async getChatSession(chatId: number | string) {
    const stringChatId = chatId.toString();

    if (!this.redisSelectors.chatSessions.test(stringChatId)) {
      throw new Error(`This is an invalid chat id: ${stringChatId}`);
    }

    return redisClient.getRawValue<ChatSessionData>(stringChatId);
  }

  /**
   * Retrieves temporary training messages from Redis.
   * @returns promise resolving to array of temporary training message strings
   */
  async getTrainingTempMessages() {
    return (await redisClient.getRawValue<string[]>(this.redisSelectors.trainingTempMessages)) || [];
  }

  /**
   * Stores temporary training messages in Redis.
   * @param messages - array of message strings to save as temporary training data
   * @returns promise resolving when the messages are stored
   */
  setTrainingTempMessages(messages: string[]) {
    return redisClient.setRawValue(this.redisSelectors.trainingTempMessages, messages);
  }

  /**
   * Stores swindler detection statistics in Redis.
   * @param statistic - map of detection category names to arrays of flagged message strings
   * @returns promise resolving when the statistics are stored
   */
  setSwindlersStatistic(statistic: RedisServiceSetSwindlersStatisticStatistic) {
    return redisClient.setRawValue(this.redisSelectors.swindlersStatistic, statistic);
  }

  /**
   * Retrieves swindler detection statistics from Redis.
   * @returns promise resolving to the statistics map, or an empty object if not set
   */
  async getSwindlersStatistic() {
    return (await redisClient.getRawValue<{ [key: string]: string[] }>(this.redisSelectors.swindlersStatistic)) || {};
  }
}

export const redisService = new RedisService();
