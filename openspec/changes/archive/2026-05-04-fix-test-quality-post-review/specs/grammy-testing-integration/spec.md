## MODIFIED Requirements

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

## ADDED Requirements

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
