import type { MessageEntity } from 'typegram/message';

export interface SendMessagePayload {
  chat_id: string | number;
  text: string;
  other?: {
    entities: MessageEntity[] | undefined;
  };
}

export interface DeleteMessagePayload {
  chat_id: string | number;
  message_id: number;
}

export interface Task {
  method: string;
  payload: SendMessagePayload | DeleteMessagePayload;
}
