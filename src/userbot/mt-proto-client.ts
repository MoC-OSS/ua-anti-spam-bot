import type { Chat, ProtoUpdate } from '../types';

import type { API } from './api';

export type Peer =
  | {
      _: 'inputPeerChannel';
      [key: string]: any;
    }
  | {
      _: `inputPeerChat`;
      chat_id: string;
    }
  | {
      _: 'inputPeerChannel';
      channel_id: string;
      access_hash: string;
    };

export class MtProtoClient {
  constructor(private api: API) {}

  messagesGetAllChats() {
    return this.api.call<ProtoUpdate>('messages.getAllChats', { except_ids: [] });
  }

  resolvePeer(chats: Chat[], title: string): Peer | null {
    const peer = chats.find((chat) => chat.title === title);

    if (!peer) {
      return null;
    }

    if (peer.migrated_to) {
      return { ...peer.migrated_to, _: 'inputPeerChannel' };
    }

    switch (peer._) {
      case 'chat': {
        return {
          _: `inputPeerChat`,
          chat_id: peer.id,
        };
      }

      case 'channel': {
        return {
          _: 'inputPeerChannel',
          channel_id: peer.id,
          access_hash: peer.access_hash,
        };
      }

      default: {
        throw new Error('Not Implemented');
      }
    }
  }

  /**
   * @param {string} query
   * */
  contactsSearch(query: string) {
    return this.api.call('contacts.search', {
      q: query,
    });
  }

  /**
   * @param {string} message
   * */
  sendSelfMessage(message: string) {
    return this.api.call('messages.sendMessage', {
      message,
      random_id: Math.ceil(Math.random() * 0xff_ff_ff) + Math.ceil(Math.random() * 0xff_ff_ff),
      peer: {
        _: 'inputPeerSelf',
      },
    });
  }

  /**
   * @param {string} message
   * @param {Record<string, any>} peer
   * */
  sendPeerMessage(message: string, peer: Record<string, any>) {
    return this.api.call('messages.sendMessage', {
      message,
      random_id: Math.ceil(Math.random() * 0xff_ff_ff) + Math.ceil(Math.random() * 0xff_ff_ff),
      peer,
    });
  }
}
