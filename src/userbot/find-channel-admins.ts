/* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-return,@typescript-eslint/restrict-template-expressions */
import fs from 'node:fs';

import type { ProtoUpdate } from '../types';

import type { API } from './api';

/**
 * @param {API} api
 * */
export async function findChannelAdmins(api: API) {
  const chat = '';

  const resolvedPeer = await api.call<ProtoUpdate>('contacts.search', {
    q: chat,
  });

  const testChannel = resolvedPeer.chats[0];

  console.info('Search Channel Found:', testChannel);

  const chatPeer = {
    _: 'inputPeerChannel',
    channel_id: testChannel.id,
    access_hash: testChannel.access_hash,
  };

  const admins = await api.call<ProtoUpdate>('channels.getParticipants', {
    channel: chatPeer,
    filter: { _: 'channelParticipantsAdmins' },
    offset: 0,
    limit: 100,
  });

  console.info(admins);

  fs.writeFileSync(
    `./admins.${chat}.txt`,
    (admins.users as any)
      .filter((admin) => admin.username || admin.phone)
      .map((admin) => `https://t.me/${admin.username || `+${admin.phone}`}`)
      .join('\t'),
  );
}
