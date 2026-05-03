## Why

grammy-testing v0.14.0 ships actor verbs for every remaining raw `bot.handleUpdate` pattern in the test suite. 34 calls across 8 files still build Telegram update objects by hand — the upgrade closes that gap entirely, making tests as readable as the membership and session tests already are.

## What Changes

- Upgrade `@grammyjs/testing` vendor package from v0.13.0 to v0.14.0
- Replace `bot.handleUpdate({ message: { new_chat_members } })` with `user.joinChat(group)`
- Replace `bot.handleUpdate({ message: { left_chat_member } })` with `user.leaveChat(group)`
- Replace `bot.handleUpdate({ edited_message })` with `user.editMessage(messageId, text)`
- Replace `bot.handleUpdate({ message: { sender_chat } })` with `channel.postMessageTo(group, text)`
- Replace `bot.handleUpdate({ message: { from: { username: 'GroupAnonymousBot' } } })` with `user.sendText(text, { anonymous: true })`
- Replace `bot.handleUpdate({ message: { /* from absent */ } })` with `group.sendSystemMessage(text)`
- Replace `bot.handleUpdate({ message: { photo, media_group_id } })` with `user.sendPhoto()` / `user.sendMediaGroup()`
- Replace `bot.handleUpdate` with hardcoded chat IDs using `chats.newSupergroup({ id })` + standard actor verbs
- Replace `bot.handleUpdate` with `reply_to_message` using `user.sendText(text, { reply_to_message })`
- Remove the local `buildChannelUpdate` helper in `no-channel-messages.composer.spec.ts`
- Remove `genericUser`, `genericUser2`, `genericUserBot` plain-object fixtures in `join-leave.composer.spec.ts`

## Capabilities

### New Capabilities

None — this is a test infrastructure change only.

### Modified Capabilities

- `grammy-testing-integration`: actor verb requirements extended to cover join/leave service messages, edited messages, channel-authored messages, anonymous admin messages, senderless system messages, photo/album messages, reply context, and specific chat ID creation

## Impact

- `tests/` — 8 spec files modified, no production code changes
- `vendor/` — new `grammyjs-testing-0.14.0.tgz`, old 0.13.0 removed
- `package.json` / `package-lock.json` — dev dependency reference updated
