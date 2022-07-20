const { env } = require('typed-dotenv').config();
const axios = require('axios');

const apiUrl = 'https://alerts.com.ua/api/states';
class AlarmService {
  /**
   *
   * @returns {Promise<any>}
   * */
  async getAlarms() {
    const opts = { headers: { 'X-API-Key': env.ALARM_KEY } };
    return axios.get(apiUrl, opts).then((response) => response.data);
  }
}

const alarmService = new AlarmService();

module.exports = {
  alarmService,
};
