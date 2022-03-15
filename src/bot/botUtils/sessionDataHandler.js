/**
 * @typedef { import("../../types").Models.StatisticsObject } StatisticsObject
 */

const getChatId = (sessionId) => sessionId.split(':')[0];

/**
 * @returns {StatisticsObject}
 */
module.exports = (sessions) => {
  const groupOnlySessions = sessions.filter(
    (session, index, self) => index === self.findIndex((t) => getChatId(t.id) === getChatId(session.id)),
  );

  const superGroupsSessions = groupOnlySessions.filter((session) => session.data.chatType === 'supergroup');
  const groupSessions = groupOnlySessions.filter((session) => session.data.chatType === 'group');
  const privateSessions = groupOnlySessions.filter((session) => session.data.chatType === 'private');
  const channelSessions = groupOnlySessions.filter((session) => session.data.chatType === 'channel');

  return {
    total_chats: groupOnlySessions.length,
    total_users: sessions.length,
    super_groups: superGroupsSessions.length,
    groups: groupSessions.length,
    active_admin: [...superGroupsSessions, ...groupSessions].filter((session) => session.data.isBotAdmin).length,
    inactive_admin: [...superGroupsSessions, ...groupSessions].filter((session) => !session.data.isBotAdmin).length,
    bot_removed: [...superGroupsSessions, ...groupSessions].filter((session) => session.data.botRemoved).length,
    private_chats: privateSessions.length,
    channels: channelSessions.length,
  };
};
