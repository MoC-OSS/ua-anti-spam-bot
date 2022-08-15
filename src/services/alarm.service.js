const path = require('node:path');
const events = require('node:events');

const { env } = require('typed-dotenv').config();
const axios = require('axios');
const EventSource = require('eventsource');

const apiUrl = 'https://alerts.com.ua/api/states';
const apiOptions = { headers: { 'X-API-Key': env.ALARM_KEY } };
const ALARM_EVENT_KEY = 'update';

class AlarmService {
  constructor() {
    /**
     * @type {EventEmitter<AlarmNotification>}
     * */
    this.updatesEmitter = new events.EventEmitter();
    this.subscribeOnNotifications();
  }

  /**
   * @returns {Promise<AlarmStates>}
   * */
  async getStates() {
    return axios
      .get(apiUrl, apiOptions)
      .then((response) => response.data)
      .catch((e) => {
        console.info(`Alarm API is not responding:  ${e}`);
      });
  }

  /**
   * Creates SSE subscription to Alarm API events
   * */
  subscribeOnNotifications() {
    const apiUrlLive = path.join(apiUrl, 'live');
    const source = new EventSource(apiUrlLive, apiOptions);
    source.onmessage = (event) => {
      if (event.event === ALARM_EVENT_KEY) {
        this.updatesEmitter.emit(ALARM_EVENT_KEY, event.data);
      }
    };
  }
}

const alarmService = new AlarmService();

module.exports = {
  alarmService,
  ALARM_EVENT_KEY,
};
