import type { MessageEntity } from '@grammyjs/types/message';
import type { Chat } from 'typegram/manage';

import type { State } from './alarm';
import type { GrammyContext } from './context';

export interface ChatSessionFlavor<S> {
  /**
   * Session data on the context object.
   *
   * **WARNING:** You have to make sure that your session data is not
   * undefined by _providing an initial value to the session middleware_, or by
   * making sure that `ctx.session` is assigned if it is empty! The type
   * system does not include `| undefined` because this is really annoying to
   * work with.
   *
   *  Accessing `ctx.session` by reading or writing will throw if
   * `getSessionKey(ctx) === undefined` for the respective context object
   * `ctx`.
   */
  get chatSession(): S;
  set chatSession(session: S | null | undefined);
}

export interface UpdatesSessionData {
  step: string;
  updatesText: string;
  textEntities: MessageEntity[];
}

export interface SessionData extends Partial<UpdatesSessionData> {
  isCurrentUserAdmin: boolean;
}

export interface AirRaidAlertSettings {
  pageNumber: number;
  state: string | null;
  notificationMessage: boolean;
}

export interface DefaultChatSettings {
  disableChatWhileAirRaidAlert: boolean;
  disableStrategicInfo?: boolean;
  disableDeleteMessage?: boolean;
  disableSwindlerMessage?: boolean;
  disableDeleteServiceMessage?: boolean;
  disableNsfwFilter?: boolean;
  disableDeleteAntisemitism?: boolean;
}

export interface OptionalChatSettings {
  enableDeleteCards?: boolean;
  enableDeleteUrls?: boolean;
  enableDeleteLocations?: boolean;
  enableDeleteMentions?: boolean;
  enableDeleteForwards?: boolean;
  enableDeleteCounteroffensive?: boolean;
  enableDeleteRussian?: boolean;
  enableWarnRussian?: boolean;
  enableDeleteObscene?: boolean;
  enableWarnObscene?: boolean;
  enableAdminCheck?: boolean;
  enableDeleteChannelMessages?: boolean;
}

export type BooleanChatSettings = DefaultChatSettings & OptionalChatSettings;

export interface ChatSettings extends BooleanChatSettings {
  airRaidAlertSettings: AirRaidAlertSettings;
}

export interface ChatSessionData {
  chatType?: Chat['type'];
  chatTitle?: string;
  chatMembersCount: number;
  botRemoved: boolean;
  isBotAdmin?: boolean;
  botAdminDate?: Date | null;
  isLimitedDeletion?: boolean;
  lastLimitedDeletionDate?: Date;
  lastWarningDate?: Date;
  chatSettings: ChatSettings;
  chatPermissions?: Chat.MultiUserGetChat['permissions'];
  isCheckAdminNotified?: boolean;
}

export interface LinkedChat {
  id: string;
  name: string;
}
export interface Session {
  id: string;
  data: SessionData;
  linkedChats?: LinkedChat[];
}

export interface ChatSession {
  id: string;
  data: ChatSessionData;
}

export interface SessionObject {
  sessions: Session[];
}

export interface RedisSessionOptions {
  property: 'session' | 'chatSession';
  state: Record<string, unknown>;
  format: Record<string, unknown>;
  getSessionKey: (context: GrammyContext) => string;
}

export type FeaturesSessionsDataKeys = keyof (BooleanChatSettings & Pick<AirRaidAlertSettings, 'notificationMessage'>);
export type FeaturesSessionsData = Record<FeaturesSessionsDataKeys, number>;

export interface ChatDetails {
  id: string;
  name: string;
  photo: string;
  users: number;
  isAdministrator?: boolean;
  airAlarm: boolean;
}

export interface ChatData {
  chat: ChatDetails;
  settings: ChatSettings;
  states: State[];
}
