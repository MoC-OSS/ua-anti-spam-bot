## 1. Build and vendor the tgz

- [x] 1.1 In `/Users/master/Documents/Projects/own/grammy-testing`, run `npm run build` to ensure `dist/` is fresh
- [x] 1.2 Run `npm pack` in the grammy-testing repo to produce `grammyjs-testing-0.22.0.tgz`
- [x] 1.3 Copy `grammyjs-testing-0.22.0.tgz` into `vendor/` in the bot project
- [x] 1.4 Delete `vendor/grammyjs-testing-0.17.0.tgz`

## 2. Update package references

- [x] 2.1 Update `package.json` devDependency: change `"file:vendor/grammyjs-testing-0.17.0.tgz"` → `"file:vendor/grammyjs-testing-0.22.0.tgz"`
- [x] 2.2 Run `pnpm install` to regenerate both `package-lock.json` and `pnpm-lock.yaml`
- [x] 2.3 Verify `node_modules/@grammyjs/testing/package.json` shows version `0.22.0`

## 3. Clean up test mock

- [x] 3.1 ~~Remove the `mockSendMessageResponse` constant~~ — NOT removed: the mock is needed. `selfDestructedReply` calls `context.api.deleteMessage(replyResult.chat.id, ...)` and grammy-testing auto-derivation does not include `chat` in the `sendMessage` response; without the mock the delete is silently skipped.
- [x] 3.2 ~~Remove the `responses: { sendMessage: mockSendMessageResponse }` option~~ — kept for the same reason as 3.1.

## 4. Verify quality gate

- [x] 4.1 Run `pnpm test` — all tests must pass (938/938 ✓)
- [x] 4.2 Run `pnpm typecheck` — zero type errors ✓
- [x] 4.3 Run `pnpm lint` — zero lint errors (2 pre-existing warnings only) ✓

## 5. Version bump and sync

- [x] 5.1 Bump version in `package.json` (patch) per project convention (1.8.1 → 1.8.2)
- [x] 5.2 Update `openspec/specs/grammy-testing-integration/spec.md` to reflect version 0.22.0 and the `user.sendCallbackQuery` addition
