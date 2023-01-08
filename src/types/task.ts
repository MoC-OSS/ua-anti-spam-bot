export interface TaskPayload {
  chat_id: string;
  text: string;
}

export interface Task {
  method: string;
  payload: TaskPayload;
}
