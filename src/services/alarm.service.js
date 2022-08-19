const events = require('node:events');

const { env } = require('typed-dotenv').config();
const axios = require('axios');
const EventSource = require('eventsource');
const { getAlarmMock } = require('./_mocks/alarm.mocks');

const apiUrl = 'https://alerts.com.ua/api/states';
const apiOptions = { headers: { 'X-API-Key': env.ALARM_KEY } };
const ALARM_EVENT_KEY = 'update';
const TEST_ALARM_STATE = 'Московська область';

class AlarmService {
  constructor() {
    /**
     * @type {EventEmitter<AlarmNotification>}
     * */
    this.updatesEmitter = new events.EventEmitter();
    this.subscribeOnNotifications();
    this.initTestAlarms();
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
    const source = new EventSource(`${apiUrl}/live`, apiOptions);
    source.onerror = (e) => {
      console.info(`Subscribe to Alarm API fail:  ${e.message}`);
    };

    source.addEventListener('open', () => {
      console.info('Opening a connection to Alarm API ...');
    });

    source.addEventListener('hello', () => {
      console.info('Connection to Alarm API opened successfully.');
    });

    source.addEventListener(
      'update',
      /**
       * @param {MessageEvent} e
       * */
      (e) => {
        /**
         * @type {AlarmNotification}
         * */
        const data = JSON.parse(e.data);
        if (data) {
          this.updatesEmitter.emit(ALARM_EVENT_KEY, data);
        }
      },
    );
  }

  initTestAlarms() {
    let alert = true;
    setInterval(() => {
      this.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(alert, TEST_ALARM_STATE));
      alert = !alert;
    }, 60000);
  }
}

const alarmService = new AlarmService();

module.exports = {
  alarmService,
  ALARM_EVENT_KEY,
  TEST_ALARM_STATE,
};
