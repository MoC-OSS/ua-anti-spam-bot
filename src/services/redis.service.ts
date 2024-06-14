import { redisClient } from '../db';
import type { ChatSession, ChatSessionData, ChatSettings, Session } from '../types';
import { removeDuplicates } from '../utils';

export class RedisService {
  redisClient = redisClient;

  redisSelectors = redisClient.redisSelectors;

  /**
   * @returns {Promise<string[]>}
   * */
  async getTrainingChatWhitelist() {
    return (await redisClient.getRawValue<string[]>(this.redisSelectors.trainingChatWhitelist)) || [];
  }

  /**
   * @returns {Promise<string[]>}
   * */
  async getTrainingBots() {
    return (await redisClient.getRawValue<string[]>(this.redisSelectors.trainingBots)) || [];
  }

  /**
   * @param {string} newChatIds
   * */
  setTrainingChatWhitelist(newChatIds: string) {
    return redisClient.setRawValue(this.redisSelectors.trainingChatWhitelist, newChatIds.replaceAll(' ', '').split(','));
  }

  /**
   * @param {string} newChatId
   * */
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
   * @returns {Promise<number>}
   * */
  getTrainingStartRank() {
    return redisClient.getRawValue<number>(this.redisSelectors.trainingStartRank);
  }

  /**
   * @param {number} newValue
   * */
  setTrainingStartRank(newValue: number) {
    if (newValue && +newValue) {
      return redisClient.setRawValue(this.redisSelectors.trainingStartRank, newValue);
    }

    console.error(`setBotTensorPercent error: ${newValue} is not a number`);
  }

  /**
   * @returns {Promise<number>}
   * */
  getBotTensorPercent() {
    return redisClient.getRawValue<number>(this.redisSelectors.botTensorPercent);
  }

  /**
   * @param {number} newValue
   * */
  setBotTensorPercent(newValue: number) {
    if (newValue && +newValue) {
      return redisClient.setRawValue(this.redisSelectors.botTensorPercent, newValue);
    }

    console.error(`setBotTensorPercent error: ${newValue} is not a number`);
  }

  /**
   * @returns {Promise<boolean>}
   * */
  getIsBotDeactivated() {
    return redisClient.getRawValue<boolean>(this.redisSelectors.isBotDeactivated);
  }

  /**
   * @param {boolean} newValue
   * */
  setIsBotDeactivated(newValue: boolean) {
    return redisClient.setRawValue(this.redisSelectors.isBotDeactivated, newValue);
  }

  /**
   * @returns {Promise<string[]>}
   * */
  async getNegatives() {
    return (await redisClient.getRawValue<string[]>(this.redisSelectors.negatives)) || [];
  }

  /**
   * @returns {Promise<string[]>}
   * */
  async getPositives() {
    return (await redisClient.getRawValue<string[]>(this.redisSelectors.positives)) || [];
  }

  /**
   * @param {string} word
   */
  async updateNegatives(word: string) {
    const words = await this.getNegatives();
    words.push(word);

    return redisClient.setRawValue(this.redisSelectors.negatives, words);
  }

  /**
   * @param {string} word
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
   * @param {string | number} chatId
   * @param {Partial<ChatSessionData>} newSession
   * */
  async updateChatSession(chatId: string | number, newSession: Partial<ChatSessionData>) {
    const stringChatId = chatId.toString();

    if (!this.redisSelectors.chatSessions.test(stringChatId)) {
      throw new Error(`This is an invalid chat id: ${stringChatId}`);
    }

    const currentSession = await redisClient.getRawValue<ChatSessionData>(stringChatId);
    const writeSession = {
      ...currentSession,
      ...newSession,
    } as ChatSessionData;

    // eslint-disable-next-line  @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    return redisClient.setRawValue(stringChatId, writeSession as any);
  }

  async updateChatSettings(chatId: string | number, newSettings: ChatSettings) {
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
   * @param {string} chatId
   * @returns {Promise<ChatSessionData>}
   * */
  async getChatSession(chatId: string | number) {
    const stringChatId = chatId.toString();

    if (!this.redisSelectors.chatSessions.test(stringChatId)) {
      throw new Error(`This is an invalid chat id: ${stringChatId}`);
    }
    return redisClient.getRawValue<ChatSessionData>(stringChatId);
  }

  /**
   * @returns {Promise<string[]>}
   * */
  async getTrainingTempMessages() {
    return (await redisClient.getRawValue<string[]>(this.redisSelectors.trainingTempMessages)) || [];
  }

  /**
   * @param {string[]} messages
   * */
  setTrainingTempMessages(messages: string[]) {
    return redisClient.setRawValue(this.redisSelectors.trainingTempMessages, messages);
  }

  /**
   * @param {{ [key: string]: string[] }} statistic
   * */
  setSwindlersStatistic(statistic: { [key: string]: string[] }) {
    return redisClient.setRawValue(this.redisSelectors.swindlersStatistic, statistic);
  }

  /**
   * @returns {Promise<{[key: string]: string[] }>}
   * */
  async getSwindlersStatistic() {
    return (await redisClient.getRawValue<{ [key: string]: string[] }>(this.redisSelectors.swindlersStatistic)) || {};
  }
}

export const redisService = new RedisService();
