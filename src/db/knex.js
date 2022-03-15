const knex = require('knex');

const dbOptions = require('../../knexfile');

// @ts-ignore
const knexClient = knex(dbOptions);

knexClient
  .raw('select 1+1 as result')
  .then(() => {
    console.info('Knex successfully connected');
  })
  .catch((err) => {
    console.error('system error', err);
    process.exit(1);
  });

module.exports = knexClient;
