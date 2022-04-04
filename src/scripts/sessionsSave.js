const { redisClient } = require('../db');
const { knexClient } = require('../db');

const { Statistics } = require('../db/models/statistics');
const { Sessions } = require('../db/models/sessions');
const { getStatisticsObjectFromSession } = require('../bot/botUtils');

const saveDataHandler = async () => {
  console.info('init knex connection');
  try {
    await knexClient.raw('select 1+1 as result');
  } catch (error) {
    console.error('system with knex error', error);
    process.exit(1);
  }
  console.info('Knex successfully connected');

  console.info('init redis connection');
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('system with redis error', error);
    process.exit(1);
  }
  console.info('Redis successfully connected');

  const statistics = Statistics(knexClient);
  const sessions = Sessions(redisClient);

  console.info('get session data from redis store');
  const statisticsObjects = await sessions.getAllSessions();
  const statisticsObject = getStatisticsObjectFromSession(statisticsObjects);

  console.info('save session data to database');
  try {
    await statistics.createRecords([statisticsObject]);
    console.info('session data successfully written');
  } catch (error) {
    console.error('Happen error when write session data to database');
    console.error(error);
  }
  process.exit(1);
};

saveDataHandler();
