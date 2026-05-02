## Why

grammy-testing v0.12.0 added auto-derivation of `getChatMember`, `getChatAdministrators`, and `getChat` from registered chat membership state, and introduced `group.own(user)` / `group.join(user)` / `chats.newOwner()` for setting creator and plain-member status. 22 of the 26 test files that currently carry manual `responses:` blocks for these methods can have that boilerplate removed entirely, making the actual intent of each test visible instead of buried under Telegram API shape noise.

## What Changes

- Remove `responses: { getChat: { invite_link: '' } }` blocks from 14 test files where `getChat` is the only mock — it is now auto-derived from the registered supergroup.
- Remove `responses: { getChatMember: { status: 'creator' } }` from 6 test files and replace with `group.own(user)` after user/group creation — auto-derivation then returns the correct `ChatMember` shape.
- Remove `getChatAdministrators` manual arrays from test files where the admin list content is not asserted — auto-derivation returns the membership map, which is semantically correct and removes dead data.
- Refactor `settings.command.spec.ts` to create named user actors with the specific IDs that its spy assertions verify, eliminating the `chatAdmins` constant and the `responses` block.
- Remove the dead `chatAdmins` constant and `responses` block from `start.command.spec.ts` (admin list is never asserted there).

## Capabilities

### New Capabilities

_(none — this is a test-infrastructure cleanup)_

### Modified Capabilities

- `grammy-testing-integration`: Add requirements that (1) auto-derivable API responses are not overridden in `responses:` unless the test is specifically verifying a non-default value, and (2) user role/membership is expressed via `group.own()` / `group.promote()` / `group.join()` instead of static `getChatMember` response overrides.

## Impact

- **22 test files** simplified; `responses:` blocks reduced or eliminated.
- **2 files kept unchanged**: `bot-queries.spec.ts` (dispatches raw updates to an unregistered chat ID — auto-derivation cannot reach it) and `self-destructed.plugin.spec.ts` (intentional `sendMessage` mock for plugin self-destruct flow).
- No production code changes.
- No new dependencies.
