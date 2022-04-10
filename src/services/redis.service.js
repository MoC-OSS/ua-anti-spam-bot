const { redisClient } = require('../db');

class RedisService {
  constructor() {
    this.redisSelectors = {
      isBotDeactivated: 'isBotDeactivated',
      botTensorPercent: 'botTensorPercent',
      positives: 'training:positives',
      negatives: 'training:negatives',
      userSessions: /^-?\d+:-?\d+$/,
      chatSessions: /^-?\d+$/,
    };
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
}

const redisService = new RedisService();

module.exports = {
  redisService,
};
