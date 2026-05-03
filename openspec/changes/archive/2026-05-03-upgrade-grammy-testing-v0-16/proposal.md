## Why

grammy-testing v0.16.0 resolves two known limitations (TODO items #26 and #27) that left magic
numbers and `as any` casts in the test suite: actor verb sends now return `Promise<Message>`,
and `group.postRelayMessage()` provides a first-class API for the Telegram relay pattern.

## What Changes

- Upgrade vendor package from `grammyjs-testing-0.14.0.tgz` to `grammyjs-testing-0.16.0.tgz`
- Replace `user.editMessage(1, ...)` magic number with `(await user.sendText(...)).message_id`
- Replace the verbose `reply_to_message: { ... } as any` relay pattern with `group.postRelayMessage()`
- Remove the `as any` cast on `reply_to_message` in `auto-comment-reply.plugin.spec.ts`

## Capabilities

### New Capabilities

_(none — this change improves test code quality, not bot features)_

### Modified Capabilities

- `grammy-testing-integration`: Two existing requirements gain cleaner canonical implementations:
  "Updates are dispatched via actor verbs" (relay scenario) and "Message edit dispatched via actor"
  (editMessage with real messageId instead of magic number).

## Impact

- `vendor/` — new tgz, old 0.14.0 tgz removed
- `package.json` / `package-lock.json` — version reference updated
- `tests/edit-message.spec.ts` — `sendText` return value used for `editMessage` messageId
- `tests/bot/plugins/auto-comment-reply.plugin.spec.ts` — relay pattern migrated to `postRelayMessage`
- `openspec/specs/grammy-testing-integration/spec.md` — scenarios updated to reflect new canonical patterns
