import { EventEmitter } from 'node:events';
import axios from 'axios';
import EventSource from 'eventsource';
import type TypedEmitter from 'typed-emitter';
import type { AlarmNotification, AlarmStates } from 'types/alarm';

import { environmentConfig } from '../config';

import { getAlarmMock } from './_mocks';

const apiUrl = 'https://alerts.com.ua/api/states';
const apiOptions = { headers: { 'X-API-Key': environmentConfig.ALARM_KEY } };
export const ALARM_EVENT_KEY = 'update';
export const TEST_ALARM_STATE = 'Московська область';

export type UpdatesEvents = {
  update: (body: AlarmNotification) => void;
};

export class AlarmService {
  updatesEmitter: TypedEmitter<UpdatesEvents>;

  constructor() {
    this.updatesEmitter = new EventEmitter() as TypedEmitter<UpdatesEvents>;
    this.subscribeOnNotifications();
    this.initTestAlarms();
  }

  getStates(): Promise<AlarmStates | null> {
    return axios
      .get<AlarmStates>(apiUrl, apiOptions)
      .then((response) => response.data)
      .catch((error: Record<any, any>) => {
        console.info(`Alarm API is not responding:  ${JSON.stringify(error)}`);
        return null;
      });
  }

  /**
   * Creates SSE subscription to Alarm API events
   * */
  subscribeOnNotifications() {
    const source = new EventSource(`${apiUrl}/live`, apiOptions);
    source.addEventListener('error', (event: MessageEvent & Record<string, any>) => {
      console.info(`Subscribe to Alarm API fail:  ${event.message as string}`);
    });

    source.addEventListener('open', () => {
      console.info('Opening a connection to Alarm API ...');
    });

    source.addEventListener('hello', () => {
      console.info('Connection to Alarm API opened successfully.');
    });

    source.addEventListener('update', (event: MessageEvent<string>) => {
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
