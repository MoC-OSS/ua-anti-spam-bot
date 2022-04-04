/**
 * @typedef { import("../../types").Models.StatisticsObject } StatisticsObject
 */

class Users {
  constructor(knex) {
    this.knex = knex;
  }

  /**
   * @param {Array<StatisticsObject>} statisticsObject
   */
  createRecords(statisticsObject) {
    return this.knex('bot_users').insert(statisticsObject);
  }
}

module.exports = {
  Statistics: (knex) => new Users(knex),
};
