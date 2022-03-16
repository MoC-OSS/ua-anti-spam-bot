const redis = require('redis');
const { env } = require('typed-dotenv').config();

const client = redis.createClient({ url: String(env.REDIS_URL) });

module.exports = client;
