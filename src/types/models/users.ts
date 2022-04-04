// import { RuleObject } from './rules';

export enum userTypes {
  Group = 'group',
  SuperGroup = 'super_group',
  Channel = 'channel',
  Private = 'private',
}

export type RuleObject = {
  id: string;
  chat_id: string;
  type: userTypes;
  is_admin: boolean;
  is_removed: boolean;
  members_count: number;
  removed_count: number;
  created_at?: Date;
};
