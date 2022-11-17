import { EventEmitter } from 'node:events';
import axios from 'axios';
import EventSource from 'eventsource';
import ms from 'ms';
import type TypedEmitter from 'typed-emitter';
import type { AlarmNotification, AlarmStates } from 'types/alarm';

import { environmentConfig } from '../config';

import { getAlarmMock } from './_mocks';

const apiUrl = 'https://alerts.com.ua/api/states';
const apiOptions = { headers: { 'X-API-Key': environmentConfig.ALARM_KEY } };

export const ALARM_CONNECT_KEY = 'connect';
export const ALARM_CLOSE_KEY = 'close';
export const ALARM_EVENT_KEY = 'update';
export const TEST_ALARM_STATE = 'Московська область';

export type UpdatesEvents = {
  connect: () => void;
  close: () => void;
  update: (body: AlarmNotification) => void;
};

export class AlarmService {
  updatesEmitter = new EventEmitter() as TypedEmitter<UpdatesEvents>;

  source?: EventSource;

  reconnectInterval?: NodeJS.Timer;

  constructor() {
    this.initTestAlarms();
  }

  getStates(): Promise<AlarmStates> {
    return axios
      .get<AlarmStates>(apiUrl, apiOptions)
      .then((response) => response.data)
      .catch((error: Record<any, any>) => {
        console.info(`Alarm API is not responding:  ${JSON.stringify(error)}`);
        return {
          states: [],
          last_update: new Date().toISOString(),
        };
      });
  }

  /**
   * Starts the connection
   * */
  enable() {
    this.subscribeOnNotifications();

    if (environmentConfig.ENV === 'production') {
      this.reconnectInterval = setInterval(() => {
        this.subscribeOnNotifications();
      }, ms('1d'));
    }
  }

  /**
   * Closes the connection
   * */
  disable() {
    if (this.source) {
      this.source.close();
      this.updatesEmitter.emit(ALARM_CLOSE_KEY);
    }

    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }
  }

  /**
   * Creates SSE subscription to Alarm API events
   * */
  subscribeOnNotifications() {
    this.disable();

    this.source = new EventSource(`${apiUrl}/live`, apiOptions);
    this.source.addEventListener('error', (event: MessageEvent & Record<string, any>) => {
      console.info(`Subscribe to Alarm API fail:  ${event.message as string}`);
    });

    this.source.addEventListener('open', () => {
      console.info('Opening a connection to Alarm API ...');
    });

    this.source.addEventListener('hello', () => {
      console.info('Connection to Alarm API opened successfully.');
      this.updatesEmitter.emit(ALARM_CONNECT_KEY);
    });

    this.source.addEventListener('update', (event: MessageEvent<string>) => {
      /**
       * SSE endpoint response
       * @see https://alerts.com.ua/en
       * */
      const data = JSON.parse(event.data) as AlarmNotification | null;
      if (data) {
        this.updatesEmitter.emit(ALARM_EVENT_KEY, data);
      }
    });
  }

  initTestAlarms() {
    let alert = true;
    setInterval(() => {
      this.updatesEmitter.emit(ALARM_EVENT_KEY, getAlarmMock(alert, TEST_ALARM_STATE));
      alert = !alert;
    }, 60_000);
  }
}

export const alarmService = new AlarmService();
