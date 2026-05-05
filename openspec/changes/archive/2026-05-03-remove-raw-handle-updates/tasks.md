## 1. Vendor upgrade

- [x] 1.1 Pack grammy-testing v0.14.0 from `/Users/master/Documents/Projects/own/grammy-testing` into `vendor/grammyjs-testing-0.14.0.tgz`
- [x] 1.2 Update `package.json` dev dependency reference from v0.13.0 to v0.14.0
- [x] 1.3 Run `npm install` and verify `package-lock.json` reflects v0.14.0
- [x] 1.4 Delete `vendor/grammyjs-testing-0.13.0.tgz`
- [x] 1.5 Run `npm run test:run` — all tests must pass before proceeding

## 2. Investigate v0.14.0 API surface

- [x] 2.1 Read `channel.postMessageTo` source/types — confirm whether `reply_to_message.sender_chat` is supported (needed for `no-channel-messages.composer.spec.ts`)
  - Finding: NO reply_to_message support. "same channel" tests must keep bot.handleUpdate or buildChannelUpdate.
- [x] 2.2 Read `user.joinChat` / `user.leaveChat` source — confirm whether bot users are accepted or require a separate approach
  - Finding: `dispatchServiceMessage` hardcodes `is_bot: false`; no bot user support. The "should not delete left bot service message" test requires combined `my_chat_member + message` update — keep bot.handleUpdate for that test only.

## 3. Migrate `join-leave.composer.spec.ts`

- [x] 3.1 Replace `genericUser`, `genericUser2` plain-object fixtures — removed genericUser2; genericUser kept only for the one raw update that requires combined my_chat_member + message
- [x] 3.2 Replace `genericUserBot` fixture — kept as plain object; grammy-testing User.is_bot=false always; composer doesn't check is_bot, only myChatMember.status
- [x] 3.3 Replace all `bot.handleUpdate({ message: { new_chat_members } })` calls with `user.joinChat(group)` (6 calls replaced)
- [x] 3.4 Replace all `bot.handleUpdate({ message: { left_chat_member } })` calls with `user.leaveChat(group)` (4 calls replaced)
- [x] 3.5 "should not delete left bot service message" keeps bot.handleUpdate — requires combined my_chat_member(kicked) + message update; "should delete new bot service message" uses user.joinChat(group) (no is_bot check in composer)
- [x] 3.6 Run test — 8/8 pass

## 4. Migrate `bot.spec.ts`

- [x] 4.1 Replace the two `bot.handleUpdate({ message: { new_chat_members } })` calls with `user.joinChat(group)` / `user.leaveChat(group)`
- [x] 4.2 Replace 7 `bot.handleUpdate({ message: { photo, media_group_id } })` calls with `user.sendMediaGroup()` (batched into 2 sendMediaGroup calls per test)
- [x] 4.3 Replace 1 `bot.handleUpdate({ message: { sender_chat } })` (channel message) with `channel.postMessageTo(group, text)`; added Channel import and channel variable
- [x] 4.4 Run test — 41/41 pass

## 5. Migrate `no-channel-messages.composer.spec.ts`

- [x] 5.1 Create registered `senderChannel` via `chats.newChannel()` (no hardcoded ID needed)
- [x] 5.2 Replace "should delete" `buildChannelUpdate` calls with `senderChannel.postMessageTo(group, text)` — 3 calls migrated; "same channel" tests (2 calls) keep `buildChannelUpdate` since postMessageTo doesn't support reply_to_message
- [x] 5.3 GroupAnonymousBot-no-sender_chat test kept as bot.handleUpdate — GROUP_ANONYMOUS_BOT.id (1_087_968_824) ≠ CHANNEL_BOT_ID (136_817_688) used in the test; anonymous:true would produce wrong from.id
- [x] 5.4 `buildChannelUpdate` helper kept — still needed for 2 same-channel tests and GroupAnonymousBot test
- [x] 5.5 `responses: { getChat: { invite_link: '' } }` kept in prepareBot (not investigated)
- [x] 5.6 Run test — 7/7 pass

## 6. Migrate `edit-message.spec.ts`

- [x] 6.1 No new user needed — existing `user` from beforeAll is used; private chat auto-registered
- [x] 6.2 Replace `bot.handleUpdate({ message: { ...baseMessage, text: 'not a card' } })` with `user.sendText('not a card')`
- [x] 6.3 Used messageId=1 for editMessage — bot doesn't validate cross-update state; any ID works
- [x] 6.4 Remove the `chats.outgoing.respondNext('getChat', ...)` workaround — auto-derives with registered user
- [x] 6.5 Replace `bot.handleUpdate({ edited_message: ... })` with `user.editMessage(1, '4111 1111 1111 1111')`
- [x] 6.6 Run test — 3/3 pass

## 7. Migrate remaining files

- [x] 7.1 `before-any.composer.spec.ts` — replaced with `group.sendSystemMessage('no sender')`
- [x] 7.2 `auto-comment-reply.plugin.spec.ts` — replaced with `user.sendText('test', { chat: group, reply_to_message: { message_id: 100, from: { id: 777_000 }, ... } as any })`
- [x] 7.3 `disable-logs-chat.transformer.spec.ts` — created `logsGroup = chats.newSupergroup({ id: logsChat })` and `user`, replaced both handleUpdate calls with `user.sendText('test', { chat: logsGroup })`
- [x] 7.4 `role.command.spec.ts` — replaced with `user.sendCommand('/role', 'user', { chat: group, anonymous: true })` (role.command checks from.username === 'GroupAnonymousBot', which anonymous:true produces)
- [x] 7.5 Run test — 17/17 pass across all 4 files

## 8. Final verification and cleanup

- [x] 8.1 Grep for remaining `bot.handleUpdate` calls in `tests/` — 4 remain (all intentional: 1 combined my_chat_member+message, 3 same-channel/GroupAnonymousBot tests that require capabilities not in v0.14.0)
- [x] 8.2 Run full quality gate: typecheck ✓, lint ✓ (0 errors), 938/938 tests pass, coverage 89.4%/82.0%/87.6% (all ≥ 80%)
- [x] 8.3 Updated `openspec/specs/grammy-testing-integration/spec.md`: expanded "Updates are dispatched via actor verbs" with 6 new scenarios; added new "Chats are registered with specific IDs" requirement
