import fs from 'node:fs';
import type { Chat } from 'typegram';

import { redisService } from '../src/services';
import type { ChatSession, Session } from '../src/types';

// eslint-disable-next-line import/first

async function processSession() {
  try {
    const sessionPath = './temp/telegraf-session.json';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, import/no-unresolved
    const { default: sessions } = await import(sessionPath);
    const chatTypes = new Set<Chat['type']>(['group', 'supergroup']);
    const delimeter = '\t';

    const localSessions = sessions as { sessions: (Session | ChatSession)[] };
    const groupAndPrivateSessions = localSessions.sessions.filter((session) =>
      redisService.redisSelectors.chatSessions.test(session.id),
    ) as ChatSession[];
    const groupSessions = groupAndPrivateSessions.filter(
      (session) => chatTypes.has(session.data.chatType || 'private') && !!session.data.chatMembersCount,
    );

    const sortedGroupSessions = groupSessions.sort((a, b) => b.data.chatMembersCount - a.data.chatMembersCount);

    type HeaderFunction = (session: ChatSession) => string | number | undefined;

    const headersMap = new Map<string, HeaderFunction>([
      ['Title', (session) => session.data.chatTitle],
      ['Type', (session) => session.data.chatType],
      ['Members', (session) => session.data.chatMembersCount],
      ['Active', (session) => (session.data.botRemoved ? 'No' : 'Yes')],
    ]);

    const csvValues = sortedGroupSessions.map((session) =>
      [...headersMap.values()].map((getFunction) => `"${getFunction(session) || ''}"`).join(delimeter),
    );

    const csvHeaders = [...headersMap.keys()].join(delimeter);

    const csv = [csvHeaders, ...csvValues].join('\n');

    fs.writeFileSync(new URL('temp/processed-telegraf-session.tsv', import.meta.url), csv, { encoding: 'utf8' });
  } catch (error) {
    console.error('Failed to load sessions:', error);
  }
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
processSession();
