const { env } = require('typed-dotenv').config();
const axios = require('axios');
const events = require('events');

const EventSource = require('eventsource');

const apiUrl = 'https://alerts.com.ua/api/states';
class AlarmService {
  constructor() {
    this.updatesEmitter = new events.EventEmitter();
    this.subscribeOnNotifications();
  }

  /**
   *
   * @returns {Promise< State[]>}
   * */
  async getStates() {
    const opts = { headers: { 'X-API-Key': env.ALARM_KEY } };
    return axios.get(apiUrl, opts).then((response) => response.data);
  }

  subscribeOnNotifications() {
    const opts = { headers: { 'X-API-Key': env.ALARM_KEY } };
    const source = new EventSource(apiUrl, opts);

    source.onmessage = (event) => {
      if (event.event === 'update') {
        this.updatesEmitter.emit('alarm', event);
      }
    };
  }
}

const alarmService = new AlarmService();

module.exports = {
  alarmService,
};
