/**
 * @typedef { import("../../types").Session } Session
 */

class Sessions {
  constructor(redis) {
    this.redis = redis;
  }

  async getSession(key) {
    if (!key) return {};
    try {
      const sourceSession = await this.redis.get(key);
      return JSON.parse(sourceSession) || {};
    } catch (error) {
      console.error(error);
      return {};
    }
  }

  /**
   *
   * @returns {Promise<Array<Session>>}
   */
  async getAllSessions() {
    try {
      const keys = await this.redis.keys('*');
      const sourceRecords = await Promise.all(keys.map((key) => this.redis.get(key)));
      return sourceRecords.map((record, index) => ({
        id: keys[index],
        data: JSON.parse(record),
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  setSession(key, value) {
    if (!key || !value) return;

    return this.redis.set(key, JSON.stringify(value));
  }
}

module.exports = {
  Sessions: (redis) => new Sessions(redis),
};
