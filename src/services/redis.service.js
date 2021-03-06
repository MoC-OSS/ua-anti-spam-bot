const { redisClient } = require('../db');

class RedisService {
  constructor() {
    this.redisClient = redisClient;
    this.redisSelectors = {
      isBotDeactivated: 'isBotDeactivated',
      botTensorPercent: 'botTensorPercent',
      positives: 'training:positives',
      negatives: 'training:negatives',
      trainingChatWhitelist: 'training:chatWhiteList',
      trainingStartRank: 'training:startRank',
      trainingTempMessages: 'training:tempMessages',
      userSessions: /^-?\d+:-?\d+$/,
      chatSessions: /^-?\d+$/,
    };
  }

  /**
   * @returns {Promise<string[]>}
   * */
  async getTrainingChatWhitelist() {
    return (await redisClient.getRawValue(this.redisSelectors.trainingChatWhitelist)) || [];
  }

  /**
   * @param {string} newChatIds
   * */
  setTrainingChatWhitelist(newChatIds) {
    return redisClient.setRawValue(this.redisSelectors.trainingChatWhitelist, newChatIds.replace(/ /g, '').split(','));
  }

  /**
   * @param {string} newChatId
   * */
  async updateTrainingChatWhitelist(newChatId) {
    const currentChats = await this.getTrainingChatWhitelist();
    currentChats.push(newChatId);

    return this.setTrainingChatWhitelist(currentChats.join(','));
  }

  /**
   * @returns {Promise<number>}
   * */
  getTrainingStartRank() {
    return redisClient.getRawValue(this.redisSelectors.trainingStartRank);
  }

  /**
   * @param {number} newValue
   * */
  setTrainingStartRank(newValue) {
    if (newValue && +newValue) {
      return redisClient.setRawValue(this.redisSelectors.trainingStartRank, newValue);
    }

    console.error(`setBotTensorPercent error: ${newValue} is not a number`);
  }

  /**
   * @returns {Promise<number>}
   * */
  getBotTensorPercent() {
    return redisClient.getRawValue(this.redisSelectors.botTensorPercent);
  }

  /**
   * @param {number} newValue
   * */
  setBotTensorPercent(newValue) {
    if (newValue && +newValue) {
      return redisClient.setRawValue(this.redisSelectors.botTensorPercent, newValue);
    }

    console.error(`setBotTensorPercent error: ${newValue} is not a number`);
  }

  /**
   * @returns {Promise<boolean>}
   * */
  getIsBotDeactivated() {
    return redisClient.getRawValue(this.redisSelectors.isBotDeactivated);
  }

  /**
   * @param {boolean} newValue
   * */
  setIsBotDeactivated(newValue) {
    return redisClient.setRawValue(this.redisSelectors.isBotDeactivated, newValue);
  }

  /**
   * @returns {Promise<string[]>}
   * */
  async getNegatives() {
    return (await redisClient.getRawValue(this.redisSelectors.negatives)) || [];
  }

  /**
   * @returns {Promise<string[]>}
   * */
  async getPositives() {
    return (await redisClient.getRawValue(this.redisSelectors.positives)) || [];
  }

  /**
   * @param {string} word
   */
  async updateNegatives(word) {
    const words = await this.getNegatives();
    words.push(word);

    return redisClient.setRawValue(this.redisSelectors.negatives, words);
  }

  /**
   * @param {string} word
   */
  async updatePositives(word) {
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
   * @param {string} chatId
   * @param {Partial<ChatSessionData>} newSession
   * */
  async updateChatSession(chatId, newSession) {
    if (!this.redisSelectors.chatSessions.test(chatId)) {
      throw new Error(`This is an invalid chat id: ${chatId}`);
    }

    const currentSession = await redisClient.getRawValue(chatId);

    /**
     * @type {Partial<ChatSessionData>}
     * */
    const writeSession = {
      ...(currentSession || {}),
      ...newSession,
    };

    return redisClient.setRawValue(chatId, writeSession).then((res) => {
      console.info(`Chat id has been updated: ${chatId}`, writeSession);
      return res;
    });
  }

  /**
   * @returns {Promise<Session[]>}
   * */
  async getUserSessions() {
    const allSessions = await redisClient.getAllRecords();
    return allSessions.filter((session) => this.redisSelectors.userSessions.test(session.id));
  }

  /**
   * @returns {Promise<ChatSession[]>}
   * */
  async getChatSessions() {
    const allSessions = await redisClient.getAllRecords();
    return allSessions.filter((session) => this.redisSelectors.chatSessions.test(session.id));
  }

  /**
   * @returns {Promise<string[]>}
   * */
  async getTrainingTempMessages() {
    return (await redisClient.getRawValue(this.redisSelectors.trainingTempMessages)) || [];
  }

  /**
   * @param {string[]} messages
   * */
  setTrainingTempMessages(messages) {
    return redisClient.setRawValue(this.redisSelectors.trainingTempMessages, messages);
  }
}

const redisService = new RedisService();

module.exports = {
  redisService,
};
