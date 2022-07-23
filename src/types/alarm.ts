export interface State {
  alert : string,
  id: number,
  name: string,
  name_en: string,
  changed: Date,
}

export interface AlarmNotification {
  state: State;
  notification_id: string;
}
