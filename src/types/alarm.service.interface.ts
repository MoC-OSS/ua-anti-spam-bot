export interface State {
  id: number;
  name: string;
  name_en: string;
}

export interface NotificationState extends State {
  alert: boolean;
  changed: Date;
}

export interface Notification {
  state: NotificationState;
  notification_id: string;
}
