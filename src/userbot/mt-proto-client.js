class MtProtoClient {
  /**
   * @param {API} api
   * */
  constructor(api) {
    this.api = api;
  }

  messagesGetAllChats() {
    return this.api.call('messages.getAllChats', { except_ids: [] });
  }

  resolvePeer(chats, title) {
    const peer = chats.find((chat) => chat.title === title);

    if (!peer) {
      return null;
    }

    if (peer.migrated_to) {
      return { ...peer.migrated_to, _: 'inputPeerChannel' };
    }

    switch (peer._) {
      case 'chat':
        return {
          _: `inputPeerChat`,
          chat_id: peer.id,
        };

      case 'channel':
        return {
          _: 'inputPeerChannel',
          channel_id: peer.id,
          access_hash: peer.access_hash,
        };

      default:
        throw new Error('Not Implemented');
    }
  }

  /**
   * @param {string} query
   * */
  contactsSearch(query) {
    return this.api.call('contacts.search', {
      q: query,
    });
  }

  /**
   * @param {string} message
   * */
  sendSelfMessage(message) {
    return this.api.call('messages.sendMessage', {
      message,
      random_id: Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff),
      peer: {
        _: 'inputPeerSelf',
      },
    });
  }

  /**
   * @param {string} message
   * @param {Record<string, any>} peer
   * */
  sendPeerMessage(message, peer) {
    return this.api.call('messages.sendMessage', {
      message,
      random_id: Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff),
      peer,
    });
  }
}

module.exports = {
  MtProtoClient,
};
