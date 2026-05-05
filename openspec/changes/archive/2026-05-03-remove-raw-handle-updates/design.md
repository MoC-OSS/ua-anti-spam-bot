## Context

The test suite has 34 remaining `bot.handleUpdate` calls that build raw Telegram update objects by hand. They fall into 8 distinct patterns, each now covered by a new grammy-testing v0.14.0 actor verb. The previous two migrations (`migrate-tests-to-grammy-testing`, `cleanup-test-response-mocks`) followed the same approach and are the direct precedent.

All changes are test-only. No production code is affected.

## Goals / Non-Goals

**Goals:**

- Upgrade vendor package to v0.14.0
- Eliminate all remaining `bot.handleUpdate` calls in `tests/`
- Remove helper fixtures and builder functions that exist only to paper over missing actor verbs
- Keep all tests passing with identical semantics

**Non-Goals:**

- Changing test assertions or test coverage
- Modifying production source code
- Adding new test cases beyond what migration requires

## Decisions

### One change, one vendor upgrade

All 34 migrations share the same root dependency (v0.14.0) and the same transformation pattern (raw update → actor verb). Splitting by file would require multiple vendor upgrades or a single upgrade commit landing mid-migration. One change avoids that.

### File-by-file task decomposition

Each task targets one spec file. This matches the previous migrations and keeps each task independently verifiable with `npm run test:run`.

### Migration order

Start with the vendor upgrade (task 1), then migrate files from simplest to most complex:

1. `vendor` upgrade
2. `join-leave.composer.spec.ts` — `joinChat`/`leaveChat` (most calls, straightforward)
3. `bot.spec.ts` — `sendMediaGroup`, `postMessageTo`, `joinChat`/`leaveChat`
4. `no-channel-messages.composer.spec.ts` — `postMessageTo`, `anonymous`, remove `buildChannelUpdate` helper
5. `edit-message.spec.ts` — `editMessage`, `newSupergroup({ id })`
6. `before-any.composer.spec.ts` — `sendSystemMessage`
7. `auto-comment-reply.plugin.spec.ts` — `reply_to_message` option
8. `disable-logs-chat.transformer.spec.ts` — `newSupergroup({ id })`
9. `role.command.spec.ts` — `anonymous` option

### `postMessageTo` and the two-channel pattern

`no-channel-messages.composer.spec.ts` tests whether `sender_chat.id === reply_to_message.sender_chat.id`. The `channel.postMessageTo(group, text)` API sets `message.sender_chat`. The `reply_to_message.sender_chat` must be set separately — either via the `reply_to_message` option (resolved in #25) or a dedicated `replyToChannelId` option on `postMessageTo`. Verify the actual v0.14.0 API signature against the source before migrating that file.

### `user.editMessage` and message ID

`edit-message.spec.ts` currently hardcodes `message_id: 1365` in both the initial message and the edit. With actor verbs, the message ID is auto-assigned by grammy-testing on `user.sendText`. The edit must reference the same ID. Use the auto-assigned ID from the first send rather than the hardcoded value.

### `getChat` responses override in `no-channel-messages.composer.spec.ts`

```ts
await prepareBot(bot, { responses: { getChat: { invite_link: '' } } });
```

With #24 resolved, `chats.newSupergroup()` registers the chat and auto-derives `getChat`. Investigate whether this override can be removed during migration, following the spec requirement to not manually override auto-derivable responses.

### Generic fixture objects vs registered users

`join-leave.composer.spec.ts` uses plain-object fixtures (`genericUser`, `genericUser2`, `genericUserBot`). After migration to `user.joinChat(group)`, the actor needs to be a grammy-testing `User` instance. Create registered users with the same IDs (`chats.newUser({ id: 1_111_111 })`). The bot fixture (`genericUserBot`) is a bot — check whether `user.joinChat` accepts a bot user or requires a separate API.

## Risks / Trade-offs

- **`postMessageTo` API surface unknown** → Read v0.14.0 source for `reply_to_message.sender_chat` support before migrating `no-channel-messages.composer.spec.ts`
- **`user.editMessage` ID mismatch** → Capture auto-assigned ID from `user.sendText` instead of using the hardcoded `1365`
- **Bot user in `joinChat`/`leaveChat`** → If `user.joinChat` only accepts human users, the bot-join/bot-leave tests in `join-leave.composer.spec.ts` may need a different approach or `sendSystemMessage`

## Open Questions

1. Does `channel.postMessageTo(group, text)` accept a `reply_to_message` or `replyToChannelId` option in v0.14.0?
2. Does `user.joinChat(group)` work for bot users, or is there a separate `bot.joinChat(group)` variant?
