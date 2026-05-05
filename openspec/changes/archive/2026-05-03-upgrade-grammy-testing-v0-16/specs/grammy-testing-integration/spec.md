## MODIFIED Requirements

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
- **THEN** it captures the returned `Message` from the prior send (`const msg = await user.sendText(...)`) and passes `msg.message_id` to `user.editMessage(msg.message_id, newText, { chat? })` — no magic numbers or hardcoded IDs

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

#### Scenario: Telegram relay message dispatched via actor

- **WHEN** a test needs to simulate a Telegram relay message (channel post forwarded into a linked group, where `from.id === 777_000`)
- **THEN** it calls `group.postRelayMessage(text, options?)` to dispatch the relay update and uses the returned `Message` as the `reply_to_message` for the subsequent user send — no inline `{ id: 777_000 }` construction and no `as any` cast

---

## ADDED Requirements

### Requirement: Actor verb sends return the dispatched Message

`user.sendText()`, `user.sendCommand()`, `user.sendPhoto()`, and other actor verb sends that
produce a single message update SHALL return `Promise<Message>`. `user.sendMediaGroup()` SHALL
return `Promise<Message[]>`. Tests SHALL use the returned `message_id` instead of hardcoded IDs
or private field access when a subsequent operation (such as `user.editMessage`) requires the ID
of a previously sent message.

#### Scenario: editMessage uses returned message_id

- **WHEN** a test sends a message and then edits it
- **THEN** it does `const msg = await user.sendText(text); await user.editMessage(msg.message_id, newText)` — the `message_id` comes from the return value, not a literal

#### Scenario: No magic number IDs in actor-verb chains

- **WHEN** a test chains two actor verbs where the second depends on the first message's ID
- **THEN** the ID is obtained from the `Message` returned by the first verb, not from a hardcoded constant or private field access such as `(chats as any).ids.messageCounter`
