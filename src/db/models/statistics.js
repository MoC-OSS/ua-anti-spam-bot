/**
 * @typedef { import("../../types").Models.StatisticsObject } StatisticsObject
 */

class Statistics {
  constructor(knex) {
    this.knex = knex;
  }

  /**
   * @param {Array<StatisticsObject>} statisticsObject
   */
  createRecords(statisticsObject) {
    return this.knex('statistics').insert(statisticsObject);
  }
}

module.exports = {
  Statistics: (knex) => new Statistics(knex),
};
