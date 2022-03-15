const { env } = require('typed-dotenv').config();

module.exports = {
  client: 'postgresql',
  connection: {
    host: env.PG_HOST,
    port: env.PG_PORT,
    database: env.PG_DATABASE,
    user: env.PG_USER,
    password: env.PG_PASSWORD,
  },
  pool: {
    min: 1,
    max: 2,
  },
  debug: env.DEBUG,
  migrations: {
    tableName: 'knex_migrations',
    directory: './src/db/migrations',
  },
};
