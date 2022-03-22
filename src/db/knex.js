const knex = require('knex');

const dbOptions = require('../../knexfile');

// @ts-ignore
const knexClient = knex(dbOptions);

module.exports = knexClient;
