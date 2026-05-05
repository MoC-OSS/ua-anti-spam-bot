## Context

grammy-testing v0.12.0 ships auto-derivation for three Telegram API methods from the library's own membership state:

- `getChatMember({ chat_id, user_id })` → looks up `chat.members.get(user_id)`, maps `Membership` → `ChatMember` discriminated union
- `getChatAdministrators({ chat_id })` → filters `chat.members` for `'creator' | 'administrator'`
- `getChat({ chat_id })` → returns `{ ...chat.toTelegramChat(), invite_link: '' }`

It also adds `group.own(user)` (status: `'creator'`), `group.join(user)` (status: `'member'`), and `chats.newOwner()` for membership setup without dispatching updates.

Before v0.12.0, tests had to provide these via `responses:` in `prepareBot`. 26 test files have such blocks. The audit (see exploration session) classified them into 5 groups.

## Goals / Non-Goals

**Goals:**

- Remove all `responses:` blocks that are pure infrastructure noise — i.e. mocking methods whose return values don't affect the test's specific assertions
- Express user role/membership via actor methods (`group.own`, `group.promote`, `group.join`) rather than static response overrides
- Keep `responses:` only for tests that genuinely need a non-default value

**Non-Goals:**

- Changing any test assertions or test logic
- Touching `bot-queries.spec.ts` (chat not registered with orchestrator — auto-derivation can't reach it)
- Changing `self-destructed.plugin.spec.ts` (intentional `sendMessage` mock)
- Any production code

## Decisions

### Decision: Group files by migration pattern, implement group by group

Five distinct patterns exist in the codebase. Grouping ensures consistent changes and makes review easier.

**Group A (14 files) — Remove `responses` entirely**
Files that only mock `getChat: { invite_link: '' }` or `getChat: {}`. No other changes needed; the registered supergroup provides the auto-derived answer.

Files: `edit-message.spec.ts`, `bot.spec.ts`, `feature-poll.composer.spec.ts`, `no-locations`, `no-russian`, `denylist`, `no-antisemitism`, `warn-obscene`, `no-obscene`, `no-counteroffensive`, `nsfw-filter`, `nsfw-message-filter`, `warn-russian`, `no-forward` composers.

**Group B (6 files) — Remove `responses` + add `group.own(user)`**
Files that mock `getChatMember: { status: 'creator' }`, optionally alongside `getChat` or a `getChatAdministrators` whose content is never asserted. Remove the block and call `group.own(user)` after user and group are created in `beforeAll`.

Files: `before-any.composer.spec.ts`, `language.command.spec.ts`, `role.command.spec.ts`, `admin-check-notify.spec.ts`, `help.command.spec.ts`, `public-command.composer.spec.ts`.

**Group C1 (1 file) — Dead `chatAdmins` + remove responses**
`start.command.spec.ts` defines a `chatAdmins` constant and passes it as `getChatAdministrators`, but no test assertion references its contents. Remove the constant, remove the `responses` block, add `group.own(user)`.

**Group C2 (1 file) — Refactor user setup to use specific IDs**
`settings.command.spec.ts` assertions verify exact user IDs from `chatAdmins` via `setUserSessionSpy`. Migration: replace the generic `user = chats.newUser()` with named actors that carry the same IDs, then set up membership via `group.own` / `group.promote`. The `chatAdmins` constant and `responses` block are then deleted; assertion values switch to `owner.id` / `admin2.id`.

**Group D (1 file) — Mixed multi-`prepareBot` case**
`strategic.composer.spec.ts` has four `prepareBot` calls in separate describe blocks. The main one and two sub-tests only mock `getChat` → remove. One sub-test additionally mocks `getChatAdministrators` with a single creator (id: 1) → create a named user actor with `{ id: 1, ... }` and call `failGroup.own(adminUser)`.

### Decision: Keep `bot-queries.spec.ts` and `self-destructed.plugin.spec.ts` unchanged

`bot-queries.spec.ts` dispatches raw `handleUpdate` calls with a hardcoded chat ID (`202_212`) that is never registered with the `chats` orchestrator. `getChatAdministrators` auto-derivation queries registered chats only — it would return `[]` for an unknown chat ID, breaking the test. A future change could add custom-ID support to `chats.newSupergroup()`; until then the explicit mock stays.

`self-destructed.plugin.spec.ts` mocks `sendMessage` to provide a specific `message_id` for the plugin's self-destruct timer. While `sendMessage` is also auto-derived now, the mock is intentional test design for the plugin's behaviour and not infrastructure noise.

## Risks / Trade-offs

- **getChatAdministrators content changes in `help` and `public-command` tests** → those tests currently mock `[]` or a full array; after migration they will receive a real `[creator]` entry from auto-derivation. Both tests only check `getMethods()` ordering, never message text, so this is safe. Verified during audit.
- **`settings.command.spec.ts` refactor touches user identity** → needs care: `user` must carry `id: 1_111_111` so both `getChatMember(user.id)` and `getChatAdministrators` return the right data. A naming mistake here would silently produce wrong IDs in spy assertions. Mitigated by running the test suite after each group.

## Migration Plan

1. Implement Group A — 14 files, mechanical removal
2. Implement Group B — 6 files, add `group.own(user)`
3. Implement Group C1 — `start.command.spec.ts`
4. Implement Group D — `strategic.composer.spec.ts`
5. Implement Group C2 — `settings.command.spec.ts` (most involved, last)
6. Run full test suite; confirm 0 regressions
