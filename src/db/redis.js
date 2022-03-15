const redis = require('redis');
const { env } = require('typed-dotenv').config();

const client = redis.createClient({ url: env.REDIS_URL });

client.connect().then(() => console.info('Redis client successfully started'));

async function getValue(key) {
  if (!key) return {};
  try {
    const sourceSession = await client.get(key);
    return JSON.parse(sourceSession) || {};
  } catch (error) {
    console.error(error);
    return {};
  }
}
function setValue(key, value) {
  if (!key || !value) return;

  return client.set(key, JSON.stringify(value));
}

async function getAllRecords() {
  try {
    const keys = await client.keys('*');
    const sourceRecords = await Promise.all(keys.map((key) => client.get(key)));
    return sourceRecords.map((record, index) => {
      try {
        return {
          id: keys[index],
          data: JSON.parse(record),
        };
      } catch (error) {
        return {};
      }
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

module.exports = {
  getValue,
  setValue,
  getAllRecords,
};
