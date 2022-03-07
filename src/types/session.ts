import { Chat } from 'typegram/manage'

export interface SessionData {
  botId: number;
  chatType: Chat['type'];
  chatTitle: string;
  botRemoved: boolean;
  isPrivate: boolean;
  isBotAdmin: boolean;
  isCurrentUserAdmin: boolean;
}

export interface Session {
  id: number;
  data: SessionData;
}

export interface SessionObject {
  sessions: Session[];
}
