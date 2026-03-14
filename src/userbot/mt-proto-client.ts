import type { Chat, ProtoUpdate } from '@app-types/mtproto/mtproto.types';

import type { API } from './api';

export type Peer =
  | {
      _: 'inputPeerChannel';

      [key: string]: any;
    }
  | {
      _: 'inputPeerChannel';
      channel_id: string;
      access_hash: string;
    }
  | {
      _: 'inputPeerChat';
      chat_id: string;
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
      // eslint-disable-next-line @typescript-eslint/naming-convention
      return { ...peer.migrated_to, _: 'inputPeerChannel' };
    }

    switch (peer._) {
      case 'chat': {
        return {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          _: 'inputPeerChat',
          chat_id: peer.id,
        };
      }

      case 'channel': {
        return {
          // eslint-disable-next-line @typescript-eslint/naming-convention
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
      // eslint-disable-next-line sonarjs/pseudo-random, unicorn/number-literal-case
      random_id: Math.ceil(Math.random() * 0xff_ff_ff) + Math.ceil(Math.random() * 0xff_ff_ff),
      peer: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _: 'inputPeerSelf',
      },
    });
  }

  /**
   * @param {string} message
   * @param {Record<string, any>} peer
   * */
  sendPeerMessage(message: string, peer: Record<string, string>) {
    return this.api.call('messages.sendMessage', {
      message,
      // eslint-disable-next-line sonarjs/pseudo-random, unicorn/number-literal-case
      random_id: Math.ceil(Math.random() * 0xff_ff_ff) + Math.ceil(Math.random() * 0xff_ff_ff),
      peer,
    });
  }
}
