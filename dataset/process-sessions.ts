import fs from 'node:fs';

import type { Chat } from 'typegram';

import { redisService } from '@services/redis.service';

import type { ChatSession, Session } from '@app-types/session';

import { logger } from '@utils/logger.util';

async function processSession() {
  try {
    const sessionPath = './temp/telegraf-session.json';

    const { default: sessions } = await import(sessionPath);
    const chatTypes = new Set<Chat['type']>(['group', 'supergroup']);
    const delimeter = '\t';

    const localSessions = sessions as { sessions: (ChatSession | Session)[] };

    const groupAndPrivateSessions = localSessions.sessions.filter((session) =>
      redisService.redisSelectors.chatSessions.test(session.id),
    ) as ChatSession[];

    const groupSessions = groupAndPrivateSessions.filter(
      (session) => chatTypes.has(session.payload.chatType || 'private') && !!session.payload.chatMembersCount,
    );

    const sortedGroupSessions = groupSessions.toSorted((left, right) => right.payload.chatMembersCount - left.payload.chatMembersCount);

    type HeaderFunction = (session: ChatSession) => number | string | undefined;

    const headersMap = new Map<string, HeaderFunction>([
      ['Title', (session) => session.payload.chatTitle],
      ['Type', (session) => session.payload.chatType],
      ['Members', (session) => session.payload.chatMembersCount],
      ['Active', (session) => (session.payload.botRemoved ? 'No' : 'Yes')],
    ]);

    const csvValues = sortedGroupSessions.map((session) =>
      [...headersMap.values()].map((getFunction) => `"${getFunction(session) || ''}"`).join(delimeter),
    );

    const csvHeaders = [...headersMap.keys()].join(delimeter);

    const csv = [csvHeaders, ...csvValues].join('\n');

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(new URL('temp/processed-telegraf-session.tsv', import.meta.url), csv, { encoding: 'utf8' });
  } catch (error) {
    logger.error({ err: error }, 'Failed to load sessions:');
  }
}

processSession();
