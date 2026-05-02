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

Tests SHALL use `user.sendText()`, `user.sendCommand()`, `user.joinChat()`, `user.leaveChat()` and equivalent actor verbs to trigger bot updates. Direct `bot.handleUpdate()` calls with raw mock update builders SHALL be replaced wherever an equivalent actor verb exists.

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

- **WHEN** a test needs to simulate a user joining or leaving a group
- **THEN** it calls `user.joinChat(group)` or `user.leaveChat(group)`

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

Tests SHALL use `group.own(user)`, `group.promote(user)`, `group.join(user)`, or `group.restrict(user)` to establish a user's role in a chat. Tests SHALL NOT use a static `getChatMember` response override as a substitute for declaring membership.

#### Scenario: Creator role expressed via own()

- **WHEN** a test needs the sending user to have `status: 'creator'` for the admin-check middleware
- **THEN** it calls `group.own(user)` in `beforeAll` after user and group are created

#### Scenario: getChatAdministrators content matches membership when asserted

- **WHEN** a test asserts on the specific user IDs or usernames returned by `getChatAdministrators`
- **THEN** those users are created via `chats.newUser({ id: ... })` with the required IDs and added to the group via `group.own()` or `group.promote()`, rather than hardcoded in a `responses` override
