import fs from 'node:fs';

import type { ProtoUpdate, User } from '@app-types/mtproto/mtproto.types';

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
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _: 'inputPeerChannel',
    channel_id: testChannel.id,
    access_hash: testChannel.access_hash,
  };

  const admins = await api.call<ProtoUpdate>('channels.getParticipants', {
    channel: chatPeer,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    filter: { _: 'channelParticipantsAdmins' },
    offset: 0,
    limit: 100,
  });

  console.info(admins);

  fs.writeFileSync(
    `./admins.${chat}.txt`,
    (admins.users as (User & { username?: string; phone?: string })[])
      .filter((admin) => admin.username || admin.phone)
      // eslint-disable-next-line sonarjs/no-nested-template-literals
      .map((admin) => `https://t.me/${admin.username || `+${admin.phone}`}`)
      .join('\t'),
  );
}
