## ADDED Requirements

### Requirement: grammy-testing is the sole test infrastructure dependency

The project SHALL use `@grammyjs/testing` as the source of all bot-testing utilities. The `src/testing/` directory SHALL be removed and SHALL NOT be referenced in any test or source file.

#### Scenario: No src/testing imports remain

- **WHEN** the codebase is scanned for imports from `@testing/` or `src/testing/`
- **THEN** zero matches are found in any `.spec.ts` file

#### Scenario: grammy-testing is installed as a dev dependency

- **WHEN** `package.json` is inspected
- **THEN** `@grammyjs/testing` appears in `devDependencies`

---

### Requirement: Bot preparation uses prepareBot or prepareComposer

Tests SHALL use `prepareBot` for full-bot E2E tests and `prepareComposer` for isolated composer and middleware tests. Manual bot construction with `new Bot('mock')` followed by `prepareBotForTesting` SHALL be replaced.

#### Scenario: E2E test prepares the full bot

- **WHEN** a test exercises the fully assembled bot (via `getBot()`)
- **THEN** it calls `prepareBot(bot, options)` and receives a `chats` handle

#### Scenario: Composer test uses prepareComposer

- **WHEN** a test exercises a single composer or middleware in isolation
- **THEN** it calls `prepareComposer(composer, options)` without manual Bot construction boilerplate

---

### Requirement: Updates are dispatched via actor verbs

Tests SHALL use `user.sendText()`, `user.sendCommand()`, `user.joinChat()`, `user.leaveChat()`,
`user.editMessage()`, `user.sendPhoto()`, `user.sendMediaGroup()`, `channel.postMessageTo()`,
`group.postRelayMessage()`, `group.sendSystemMessage()`, and the `anonymous` option on send verbs
to trigger bot updates. Direct `bot.handleUpdate()` calls with hand-crafted update payloads SHALL
be replaced wherever an equivalent actor verb exists. No `bot.handleUpdate` calls with
hand-crafted update payloads SHALL remain in any `.spec.ts` file.

#### Scenario: Text message dispatched via actor

- **WHEN** a test needs to simulate a supergroup text message
- **THEN** it calls `user.sendText(text, { chat: group })` instead of `bot.handleUpdate(new MessageMockUpdate(text).build())`

#### Scenario: Private message dispatched via actor

- **WHEN** a test needs to simulate a private chat message
- **THEN** it calls `user.sendText(text)` (no chat argument — private is the default)

#### Scenario: Bot command dispatched via actor

- **WHEN** a test needs to simulate a bot command
- **THEN** it calls `user.sendCommand('/commandName', args?)` instead of manually constructing `bot_command` entities

#### Scenario: Member join/leave dispatched via actor

- **WHEN** a test needs to simulate a user joining or leaving a group via service message
- **THEN** it calls `user.joinChat(group)` or `user.leaveChat(group)` instead of `bot.handleUpdate({ message: { new_chat_members } })`

#### Scenario: Message edit dispatched via actor

- **WHEN** a test needs to simulate a user editing a previously sent message
- **THEN** it captures the returned `Message` from the prior send (`const message = await user.sendText(...)`) and passes `message.message_id` to `user.editMessage(message.message_id, newText, { chat? })` — no magic numbers or hardcoded IDs

#### Scenario: Channel-authored message dispatched via actor

- **WHEN** a test needs to simulate a message posted by a channel into a group
- **THEN** it calls `channel.postMessageTo(group, text, options?)` instead of `bot.handleUpdate({ message: { sender_chat } })` and uses the returned `Message` when a follow-up verb depends on the message ID

#### Scenario: Same-channel reply dispatched via actor

- **WHEN** a test needs to simulate a channel posting a message that replies to an earlier post from the same channel (i.e. `message.sender_chat.id === message.reply_to_message.sender_chat.id`)
- **THEN** it calls `channel.postMessageTo(group, text, { reply_to_message: { sender_chat: channel.toTelegramChat(), message_id } })` instead of constructing a raw `handleUpdate` payload

#### Scenario: Anonymous admin message dispatched via actor

- **WHEN** a test needs to simulate a group admin posting as the group (GroupAnonymousBot)
- **THEN** it calls `user.sendText(text, { chat: group, anonymous: true })` or `user.sendCommand(cmd, args, { chat: group, anonymous: true })`

#### Scenario: Senderless system message dispatched via actor

- **WHEN** a test needs to simulate a message with no `from` field
- **THEN** it calls `group.sendSystemMessage(text)` instead of `bot.handleUpdate({ message: { /* from absent */ } } as any)`

#### Scenario: Photo and media group messages dispatched via actor

- **WHEN** a test needs to simulate a user sending a photo or an album
- **THEN** it calls `user.sendPhoto(file?, options?)` or `user.sendMediaGroup(items, options?)` instead of `bot.handleUpdate({ message: { photo, media_group_id } })`

#### Scenario: Reply-to-message context set via options

- **WHEN** a test needs to simulate a user replying to a specific message (including Telegram relay messages)
- **THEN** it calls `user.sendText(text, { chat, reply_to_message: { ... } })` instead of `bot.handleUpdate` with an inline `reply_to_message` payload

#### Scenario: Telegram relay message dispatched via actor

- **WHEN** a test needs to simulate a Telegram relay message (channel post forwarded into a linked group, where `from.id === 777_000`)
- **THEN** it calls `group.postRelayMessage(text, options?)` to dispatch the relay update and uses the returned `Message` as the `reply_to_message` for the subsequent user send — no inline `{ id: 777_000 }` construction and no `as any` cast

---

### Requirement: Actor verb sends return the dispatched Message

`user.sendText()`, `user.sendCommand()`, `user.sendPhoto()`, `channel.postMessageTo()`, and other
actor verb sends that produce a single message update SHALL return `Promise<Message>`.
`user.sendMediaGroup()` SHALL return `Promise<Message[]>`. Tests SHALL use the returned `message_id`
instead of hardcoded IDs or private field access when a subsequent operation (such as
`user.editMessage`) requires the ID of a previously sent message.

#### Scenario: editMessage uses returned message_id

- **WHEN** a test sends a message and then edits it
- **THEN** it does `const message = await user.sendText(text); await user.editMessage(message.message_id, newText)` — the `message_id` comes from the return value, not a literal

#### Scenario: No magic number IDs in actor-verb chains

- **WHEN** a test chains two actor verbs where the second depends on the first message's ID
- **THEN** the ID is obtained from the `Message` returned by the first verb, not from a hardcoded constant or private field access such as `(chats as any).ids.messageCounter`

---

### Requirement: Session and state mocking import paths updated

Tests SHALL import `mockSession`, `mockChatSession`, and `mockState` from `@grammyjs/testing` (low-level export). Call sites and destructured return values SHALL remain unchanged.

#### Scenario: Session mock import updated

- **WHEN** a test uses `mockSession` or `mockChatSession`
- **THEN** the import resolves to `@grammyjs/testing` and the call site is identical to the previous version

---

### Requirement: Deletion assertions use chats.deletionsFor

Composer and E2E tests that verify a message was deleted SHALL use `chats.deletionsFor(chat)` to assert which specific message was deleted. Checking only that `'deleteMessage'` appears in `getMethods()` is insufficient when the deleted message can be identified.

#### Scenario: Correct spam message is deleted

- **WHEN** a filter composer deletes a message
- **THEN** the test asserts `chats.deletionsFor(group).lastOrThrow().reply?.text` equals the spam text, not only that `deleteMessage` appears in `getMethods()`

#### Scenario: getMethods ordering check retained

- **WHEN** a test verifies that deletion occurs before or after another API call
- **THEN** `chats.outgoing.getMethods()` is still used alongside `deletionsFor` for ordering assertions

---

### Requirement: Auto-derivable API responses are not manually overridden in responses blocks

Tests SHALL NOT provide a `responses:` entry for `getChatMember`, `getChatAdministrators`, or `getChat` unless the test is specifically verifying behaviour that depends on a non-default value (e.g. a restricted user, a specific invite link, an empty admin list that contrasts with a populated one). These three methods are auto-derived from the registered chat membership state by grammy-testing v0.12.0+.

#### Scenario: getChatMember is not mocked when user has creator status

- **WHEN** a test needs the sending user to be treated as the group creator
- **THEN** it calls `group.own(user)` after creating the user and group, and does NOT pass `getChatMember` in the `responses` option

#### Scenario: getChatAdministrators is not mocked when admin list content is not asserted

- **WHEN** a test calls a command that internally fetches the admin list but the test does not assert on the list's content
- **THEN** the test does NOT pass `getChatAdministrators` in the `responses` option; the auto-derived list from group membership is sufficient

#### Scenario: getChat is not mocked in standard supergroup tests

- **WHEN** a test uses a supergroup created via `chats.newSupergroup()` and no test assertion depends on a specific `invite_link` value
- **THEN** the test does NOT pass `getChat` in the `responses` option

---

### Requirement: User role and membership is expressed via actor methods

Tests SHALL use `group.own(user)`, `group.promote(user)`, `group.join(user)`, or
`group.restrict(user)` to establish a user's role in a chat. Tests SHALL NOT use a static
`getChatMember` response override — whether via `responses:` blocks or via
`chats.outgoing.respondNext('getChatMember', ...)` — as a substitute for declaring membership.
When a test needs to verify bot behaviour for a user with a specific role that differs from
the role used in other tests, a dedicated actor SHALL be created with that role via the
appropriate membership method, rather than overriding the existing actor's auto-derived response.

#### Scenario: Creator role expressed via own()

- **WHEN** a test needs the sending user to have `status: 'creator'` for the admin-check middleware
- **THEN** it calls `group.own(user)` in `beforeAll` after user and group are created

#### Scenario: getChatAdministrators content matches membership when asserted

- **WHEN** a test asserts on the specific user IDs or usernames returned by `getChatAdministrators`
- **THEN** those users are created via `chats.newUser({ id: ... })` with the required IDs and added to the group via `group.own()` or `group.promote()`, rather than hardcoded in a `responses` override

#### Scenario: Non-admin path tested via dedicated actor

- **WHEN** a test needs to verify that the bot rejects a command from a regular member, but the primary `user` actor in the file has `creator` or `administrator` status
- **THEN** the test uses a separate actor (`regularUser = chats.newUser()`) registered with `group.join(regularUser)`, and does NOT call `chats.outgoing.respondNext('getChatMember', { status: 'member' })` on the existing actor

#### Scenario: respondNext not used as role override

- **WHEN** any test needs a user to be treated as a specific role
- **THEN** that role is expressed via `group.own()`, `group.join()`, `group.promote()`, or `group.restrict()` on the actor, not via a `respondNext` override of the auto-derived `getChatMember` response

---

### Requirement: Chats are registered with specific IDs when hardcoded IDs are required

When a test exercises bot behavior that targets a specific chat ID (e.g. a configured logs channel
or training chat), that chat SHALL be created via `chats.newSupergroup({ id })`,
`chats.newGroup({ id })`, or `chats.newChannel({ id })` so that auto-derivation for `getChat`
and `getChatAdministrators` works correctly. Tests SHALL NOT rely on `respondNext('getChat', ...)`
as a substitute for registering the chat.

#### Scenario: Logs chat registered by ID

- **WHEN** a test dispatches an update to a hardcoded logs chat ID
- **THEN** it calls `chats.newSupergroup({ id: logsChat })` in `beforeAll` so `getChat` auto-derives correctly

#### Scenario: No respondNext patch for registered chats

- **WHEN** a test uses a chat registered via `chats.new*(id)` or `chats.new*({ id })`
- **THEN** it does NOT call `chats.outgoing.respondNext('getChat', ...)` before dispatching updates to that chat

---

### Requirement: beforeEach state resets use chats.clear()

Tests SHALL call `chats.clear()` in `beforeEach` to reset grammy-testing observable state
between test cases. Tests SHALL NOT call `chats.outgoing.clear()`, `user.replies.clear()`, and
`chats.deletionsFor(chat).clear()` as separate calls when a full reset is intended. App-level
state objects (`session`, `chatSession`, `state`) are outside grammy-testing's scope and SHALL
be reset explicitly in the same `beforeEach` block when any test in the suite mutates them.

#### Scenario: beforeEach uses chats.clear() instead of triple-clear

- **WHEN** a test suite needs to reset outgoing requests, reply inboxes, and deletion logs between tests
- **THEN** `beforeEach` calls `chats.clear()` once, not three separate `clear()` calls

#### Scenario: App-state mutations are reset alongside chats.clear()

- **WHEN** one or more tests in a suite mutate a shared `state`, `session`, or `chatSession` object
- **THEN** `beforeEach` resets the affected fields to their default values in addition to calling `chats.clear()`
