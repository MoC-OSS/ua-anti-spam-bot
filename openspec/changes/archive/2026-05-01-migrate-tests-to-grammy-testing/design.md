## Context

The bot's `src/testing/` directory contains 6 files that duplicate patterns now shipped by `grammy-testing`:

| Bot utility                                    | Library equivalent                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `prepareBotForTesting(bot, { getChat })`       | `prepareBot(bot, { responses: { getChat } })`                      |
| `OutgoingRequests`                             | `chats.outgoing` (same interface)                                  |
| `mockSession / mockChatSession / mockState`    | Identical API — import path only                                   |
| `GenericMockUpdate / MessageMockUpdate / etc.` | Actor verbs (`user.sendText`, `user.sendCommand`, `user.joinChat`) |

`grammy-testing@0.10.0` also provides capabilities the bot cannot currently test at all: `chats.deletionsFor(chat)` (which message was deleted), `chats.editsFor(user)`, `reply.clickButton()`, and back-references from `Deletion.reply` to the original message.

The library is installed from a local tarball (`grammyjs-testing-0.10.0.tgz`) built from the sibling `grammy-testing` project. When the package is published to npm the tarball path becomes a semver range.

## Goals / Non-Goals

**Goals:**

- Remove `src/testing/` entirely (no dead code, no dual maintenance)
- All 101 spec files pass against `grammy-testing` imports with equivalent or stronger assertions
- Deletion-heavy composer tests upgraded to `chats.deletionsFor(chat)` assertions

**Non-Goals:**

- No production code changes (`src/bot/`, `src/services/`, `src/server/`)
- No new test coverage — existing scenarios only; new scenarios are a separate task
- No changes to `vi.mock(...)` service-mocking patterns (outside grammy-testing scope)
- No publishing the library to npm (separate concern)

## Decisions

### 1. Session/state mocking: zero call-site changes

`mockSession`, `mockChatSession`, `mockState` in grammy-testing have byte-for-byte identical signatures to the bot's own utilities. Every call site changes only its import path — no destructuring, no argument changes. This eliminates a category of migration risk entirely.

_Alternative considered_: Wrap grammy-testing utilities in a thin local adapter. Rejected — adds indirection for no benefit given identical signatures.

### 2. `prepareBot` for E2E, `prepareComposer` for isolated composer tests

- **`bot.spec.ts`** (full bot assembled via `getBot()`): use `prepareBot(bot, { responses })`. The bot is already assembled before wrapping; `prepareBot` just installs the transformer.
- **Composer/middleware tests** (28 + 14 files): use `prepareComposer(composer, { responses, state })`. Replaces the boilerplate `new Bot('mock') → bot.use(middleware) → prepareBotForTesting(bot)` pattern with a single call. The `state` option wires `mockState` automatically for composers that need it.

### 3. Dispatch pattern: actor verbs over raw update builders

Replace every `bot.handleUpdate(new XxxMockUpdate(...).build())` call with the appropriate actor verb. Mapping:

| Before                                                       | After                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| `new MessageMockUpdate('text').build()`                      | `user.sendText('text', { chat: group })`                       |
| `new MessagePrivateMockUpdate('text').build()`               | `user.sendText('text')` _(private is default)_                 |
| `new MessageMockUpdate('/cmd').buildOverwrite({ entities })` | `user.sendCommand('/cmd')`                                     |
| `new NewMemberMockUpdate().build()`                          | `user.joinChat(group)`                                         |
| `new LeftMemberMockUpdate().build()`                         | `user.leaveChat(group)`                                        |
| `new MyChatMemberMockUpdate().build()`                       | `group.addBot()` / `group.removeBot()` _(or low-level export)_ |

`buildOverwrite` for non-command entity scenarios (rare) falls back to `user.sendText(text, { entities })`.

### 4. Assertion upgrade for deletion-heavy tests

Composers that delete spam messages currently assert only that `'deleteMessage'` appears in `getMethods()`. After migration, the primary assertion becomes:

```typescript
const deletion = chats.deletionsFor(group).lastOrThrow();
expect(deletion.reply?.text).toBe(spamText); // correct message deleted
```

`getMethods()` checks are kept where ordering matters (e.g. delete-before-notify sequences).

### 5. Migration order: composer → middleware → E2E

1. **Composer tests** (28 files) — most isolated, cleanest mapping, validates the approach
2. **Middleware tests** (14 files) — same pattern, slightly more setup variation
3. **`bot.spec.ts` + `edit-message.spec.ts`** — full bot, most complex, done last once the pattern is proven

This order means any pattern issues surface early at low cost.

### 6. Detached async: use `vi.waitFor` selectively

`chats.idle()` does not track fire-and-forget chains. Tests that rely on detached work (identified during migration) use `vi.waitFor(() => user.replies.length >= N)` per the library's documented workaround. No library changes required.

## Risks / Trade-offs

| Risk                                                                | Mitigation                                                                                   |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Detached async tests silently pass without waiting                  | Identify during composer spike; add `vi.waitFor` before marking done                         |
| `buildOverwrite` edge cases with no actor-verb equivalent           | Keep raw `bot.handleUpdate()` for those specific cases; actor verbs not mandatory everywhere |
| Library tarball path breaks if file moves                           | Pin to absolute path in devDependencies; update when published to npm                        |
| 101 files is a large surface — regressions from mechanical rewrites | Run `npm test` after each group of files; never merge a batch with failing tests             |
