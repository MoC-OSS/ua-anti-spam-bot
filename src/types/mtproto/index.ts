export interface ChatPhoto {
  _: string;
}

export interface Chat {
  _: string;
  flags: number;
  creator: boolean;
  left: boolean;
  broadcast: boolean;
  verified: boolean;
  megagroup: boolean;
  restricted: boolean;
  signatures: boolean;
  min: boolean;
  scam: boolean;
  has_link: boolean;
  has_geo: boolean;
  slowmode_enabled: boolean;
  call_active: boolean;
  call_not_empty: boolean;
  fake: boolean;
  gigagroup: boolean;
  noforwards: boolean;
  id: string;
  access_hash: string;
  title: string;
  username: string;
  photo: ChatPhoto;
  date: number;
}

export interface FromId {
  _: string;
  user_id: string;
}

export interface PeerId {
  _: string;
  channel_id: string;
}

export interface Replies {
  _: string;
  flags: number;
  comments: boolean;
  replies: number;
  replies_pts: number;
}

export interface Message {
  _: string;
  flags: number;
  out: boolean;
  mentioned: boolean;
  media_unread: boolean;
  silent: boolean;
  post: boolean;
  from_scheduled: boolean;
  legacy: boolean;
  edit_hide: boolean;
  pinned: boolean;
  noforwards: boolean;
  id: number;
  from_id: FromId;
  peer_id: PeerId;
  date: number;
  message: string;
  replies: Replies;
}

export interface Update {
  _: string;
  message: Message;
  pts: number;
  pts_count: number;
}

export interface Status {
  _: string;
}

export interface User {
  _: string;
  flags: number;
  self: boolean;
  contact: boolean;
  mutual_contact: boolean;
  deleted: boolean;
  bot: boolean;
  bot_chat_history: boolean;
  bot_nochats: boolean;
  verified: boolean;
  restricted: boolean;
  min: boolean;
  bot_inline_geo: boolean;
  support: boolean;
  scam: boolean;
  apply_min_photo: boolean;
  fake: boolean;
  id: string;
  access_hash: string;
  first_name: string;
  status: Status;
}

export interface Photo {
  _: string;
  flags: number;
  has_video: boolean;
  photo_id: string;
  stripped_thumb: Uint8Array;
  dc_id: number;
}

export interface DefaultBannedRights {
  _: string;
  flags: number;
  view_messages: boolean;
  send_messages: boolean;
  send_media: boolean;
  send_stickers: boolean;
  send_gifs: boolean;
  send_games: boolean;
  send_inline: boolean;
  embed_links: boolean;
  send_polls: boolean;
  change_info: boolean;
  invite_users: boolean;
  pin_messages: boolean;
  until_date: number;
}

export interface ProtoUpdate {
  _: string;
  updates: Update[];
  users: User[];
  chats: Chat[];
  date: number;
  seq: number;
}
