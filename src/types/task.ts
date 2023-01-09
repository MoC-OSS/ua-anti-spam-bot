export interface SendMessagePayload {
  chat_id: string | number;
  text: string;
}

export interface DeleteMessagePayload {
  chat_id: string | number;
  message_id: number;
}

export interface Task {
  method: string;
  payload: SendMessagePayload | DeleteMessagePayload;
}
