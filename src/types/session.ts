import { Chat } from 'typegram/manage'

export interface SessionData {
  chatType: Chat['type'];
  chatTitle?: string;
  botRemoved: boolean;
  isBotAdmin: boolean;
  botAdminDate: Date;
  isCurrentUserAdmin: boolean;
}

export interface Session {
  id: string;
  data: SessionData;
}

export interface SessionObject {
  sessions: Session[];
}
