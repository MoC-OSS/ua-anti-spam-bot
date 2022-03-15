/**
 * @typedef { import("../../types").Models.StatisticsObject } StatisticsObject
 */

const knex = require('../knex');

/**
 * @param {Array<StatisticsObject>} statisticsObject
 */
const createRecords = (statisticsObject) => knex('statistics').insert(statisticsObject);

module.exports = {
  createRecords,
};
