## ADDED Requirements

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

### Requirement: User role and membership is expressed via actor methods
Tests SHALL use `group.own(user)`, `group.promote(user)`, `group.join(user)`, or `group.restrict(user)` to establish a user's role in a chat. Tests SHALL NOT use a static `getChatMember` response override as a substitute for declaring membership.

#### Scenario: Creator role expressed via own()
- **WHEN** a test needs the sending user to have `status: 'creator'` for the admin-check middleware
- **THEN** it calls `group.own(user)` in `beforeAll` after user and group are created

#### Scenario: getChatAdministrators content matches membership when asserted
- **WHEN** a test asserts on the specific user IDs or usernames returned by `getChatAdministrators`
- **THEN** those users are created via `chats.newUser({ id: ... })` with the required IDs and added to the group via `group.own()` or `group.promote()`, rather than hardcoded in a `responses` override
