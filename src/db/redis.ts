import redis from 'redis';
import { env } from 'typed-dotenv'.config();

export const client = redis.createClient({ url: env.REDIS_URL });

async function getRawValue(key) {
  if (!key) return {};
  try {
    const sourceSession = await client.get(key);
    return JSON.parse(sourceSession);
  } catch (error) {
    return null;
  }
}

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

function setRawValue(key, value) {
  return client.set(key, JSON.stringify(value));
}

function setValue(key, value) {
  if (!key || !value) return;

  return client.set(key, JSON.stringify(value));
}

function removeKey(key) {
  if (!key) {
    return null;
  }

  return client.del(key);
}

/**
 * @returns {Promise<(Session | ChatSession)[]>}
 * */
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
  client,
  getAllRecords,
  getRawValue,
  getValue,
  removeKey,
  setRawValue,
  setValue,
};
