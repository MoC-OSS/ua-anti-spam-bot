## MODIFIED Requirements

### Requirement: Updates are dispatched via actor verbs

Tests SHALL use `user.sendText()`, `user.sendCommand()`, `user.joinChat()`, `user.leaveChat()`,
`user.editMessage()`, `user.sendPhoto()`, `user.sendMediaGroup()`, `channel.postMessageTo()`,
`group.sendSystemMessage()`, and the `anonymous` option on send verbs to trigger bot updates.
Direct `bot.handleUpdate()` calls with raw mock update objects SHALL be replaced wherever an
equivalent actor verb exists. No `bot.handleUpdate` calls with hand-crafted update payloads
SHALL remain in any `.spec.ts` file.

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
- **THEN** it calls `user.editMessage(messageId, newText, { chat? })` instead of `bot.handleUpdate({ edited_message })`

#### Scenario: Channel-authored message dispatched via actor

- **WHEN** a test needs to simulate a message posted by a channel into a group
- **THEN** it calls `channel.postMessageTo(group, text)` instead of `bot.handleUpdate({ message: { sender_chat } })`

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

---

## ADDED Requirements

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
