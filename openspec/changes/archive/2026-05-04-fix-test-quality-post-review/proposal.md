## Why

Code review of the grammy-testing migration (UABOT-240) surfaced five test-quality issues: API-override workarounds that violate the project's own spec, a missed `chats.clear()` adoption that every file duplicates as a three-call pattern, and minor style inconsistencies that create noise when reading test output. Fixing them now keeps the test suite aligned with the grammy-testing-integration spec before new features layer on top.

## What Changes

- **Replace `respondNext` membership overrides with dedicated actor** — `settings.command.spec.ts` and `role.command.spec.ts` use `chats.outgoing.respondNext('getChatMember', { status: 'member' })` to simulate a non-admin; replace with a `regularUser` actor registered via `group.join()`.
- **Adopt `chats.clear()` in all `beforeEach` blocks** — every spec file manually calls `chats.outgoing.clear()` + `user.replies.clear()` + `chats.deletionsFor(group).clear()`; replace with the single atomic `chats.clear()` that already exists in grammy-testing v0.13+.
- **Remove redundant `?.method` assertions in `no-channel-messages.composer.spec.ts`** — assertions like `expect(deleteMessageRequest?.method).toEqual('deleteMessage')` repeat information already encoded in the `getAll<'deleteMessage', ...>()` type parameters; replace with the `getMethods()` + `buildMethods()` pattern used in other specs.
- **Fix `.requests` access in `bot.spec.ts`** — five assertions use `expect(chats.outgoing.requests).toHaveLength(n)` instead of `expect(chats.outgoing).toHaveLength(n)`; standardise to the direct form.
- **Add app-state reset in `admin-check-notify.spec.ts`** — `state.isDeleted` and `chatSession.chatSettings.enableAdminCheck` are mutated per-test but never reset in `beforeEach`, making test order load-bearing; add explicit resets.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `grammy-testing-integration`: tighten the requirement that `getChatMember` auto-derivation is the only permitted membership mechanism (no `respondNext` substitutes), and add a requirement that `chats.clear()` is the standard `beforeEach` reset.

## Impact

- Affected files: `tests/bot/commands/public/settings.command.spec.ts`, `tests/bot/commands/public/role.command.spec.ts`, `tests/bot/composers/messages/no-channel-messages.composer.spec.ts`, `tests/bot.spec.ts`, `tests/bot/middleware/admin-check-notify.spec.ts`, and all other spec files that use the triple-clear pattern.
- No production code changes. No grammy-testing library changes. No new dependencies.
