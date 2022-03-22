export type StatisticsObject = {
  id?: string;
  total_chats: number;
  total_users: number;
  super_groups: number;
  groups: number;
  active_admin: number;
  inactive_admin: number;
  bot_removed: number;
  private_chats: number;
  channels: number;
  created_at?: Date;
};
