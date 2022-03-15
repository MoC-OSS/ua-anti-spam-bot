const cron = require('node-cron');
const { getStatisticsObjectFromSession } = require('../bot/botUtils');

const { redisClient } = require('../db');
const { Statistics } = require('../db/models');

const saveDataHandler = async () => {
  console.info('get session data from redis store');
  const sessions = await redisClient.getAllRecords();
  const statisticsObject = getStatisticsObjectFromSession(sessions);

  console.info('save session data to database');
  try {
    await Statistics.createRecords([statisticsObject]);
    console.info('session data successfully written');
  } catch (error) {
    console.error('Happen error when write session data to database');
    console.error(error);
  }
};

module.exports = () => {
  console.info('initialize cron worker');

  cron.schedule('*/30 * * * *', saveDataHandler); // each 30 min
};
