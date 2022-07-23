const { env } = require('typed-dotenv').config();
const axios = require('axios');
const events = require('events');

const EventSource = require('eventsource');
const { getAlarmMock } = require('./_mocks/alarm.mock');

const apiUrl = 'https://alerts.com.ua/api/states';
const apiOptions = { headers: { 'X-API-Key': env.ALARM_KEY } };
const ALARM_EVENT_KEY = 'update';

class AlarmService {
  constructor() {
    this.updatesEmitter = new events.EventEmitter();
    this.subscribeOnNotifications();

    // For development
    // this.mockAlarms();
  }

  /**
   *
   * @returns {Promise< AlarmNotification[]>}
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
    const source = new EventSource(apiUrl, apiOptions);
    source.onmessage = (event) => {
      if (event.event === ALARM_EVENT_KEY) {
        this.updatesEmitter.emit(ALARM_EVENT_KEY, event.data);
      }
    };
  }

  /**
   * For development. Emits two alarm values at 20 second interval after init.
   * 20s waiting => start air alarm with mock => 20s waiting => end air alarm with mock
   * */
  mockAlarms() {
    setTimeout(() => {
      this.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(true));
    }, 20000);

    setTimeout(() => {
      this.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(false));
    }, 40000);
  }
}

const alarmService = new AlarmService();

module.exports = {
  alarmService,
  ALARM_EVENT_KEY,
};
