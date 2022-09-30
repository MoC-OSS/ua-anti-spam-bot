export interface State {
  alert: boolean;
  id: number;
  name: string;
  name_en: string;
  changed: Date;
}

export interface AlarmNotification {
  state: State;
  notification_id: string;
}

export interface AlarmStates {
  states: State[];
  last_update: string;
}
