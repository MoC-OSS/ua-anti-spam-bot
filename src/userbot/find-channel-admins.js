const fs = require('fs');

/**
 * @param {API} api
 * */
async function findChannelAdmins(api) {
  const chat = '';

  const resolvedPeer = await api.call('contacts.search', {
    q: chat,
  });

  const testChannel = resolvedPeer.chats[0];

  console.info('Search Channel Found: ', testChannel);

  const chatPeer = {
    _: 'inputPeerChannel',
    channel_id: testChannel.id,
    access_hash: testChannel.access_hash,
  };

  const admins = await api.call('channels.getParticipants', {
    channel: chatPeer,
    filter: { _: 'channelParticipantsAdmins' },
    offset: 0,
    limit: 100,
  });

  console.info(admins);

  fs.writeFileSync(
    `./admins.${chat}.txt`,
    admins.users
      .filter((admin) => admin.username || admin.phone)
      .filter((admin) => ![].includes(admin.username))
      .map((admin) => `https://t.me/${admin.username || `+${admin.phone}`}`)
      .join('\t'),
  );
}

module.exports = {
  findChannelAdmins,
};
