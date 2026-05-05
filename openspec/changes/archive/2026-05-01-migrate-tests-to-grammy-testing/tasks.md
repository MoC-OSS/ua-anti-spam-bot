## 1. Dependency Setup

- [x] 1.1 Create `vendor/` directory and copy `grammyjs-testing-0.10.0.tgz` into it
- [x] 1.2 Install from the vendored tarball: `npm install --save-dev file:./vendor/grammyjs-testing-0.10.0.tgz`
- [x] 1.3 Add `vendor/` to `.dockerignore` (tarball is a devDep — excluded from production image)
- [x] 1.4 Remove `@testing` path alias from `tsconfig.json` and `vitest.config.ts`
- [x] 1.5 Verify `npm test` still passes with no test file changes (baseline)

## 2. Spike: Validate Migration Pattern

- [x] 2.1 Migrate `tests/bot/composers/messages/no-russian.composer.spec.ts` — replace `prepareBotForTesting` → `prepareBot`, `MessageMockUpdate` → `user.sendText`, upgrade deletion assertion to `chats.deletionsFor(group)`
- [x] 2.2 Run the single spec and confirm it passes; note any `vi.waitFor` requirements for detached async

## 3. Message Filter Composer Tests (17 files)

- [x] 3.1 `no-cards.composer.spec.ts` (file does not exist — skipped)
- [x] 3.2 `no-urls.composer.spec.ts` (file does not exist — skipped)
- [x] 3.3 `no-locations.composer.spec.ts`
- [x] 3.4 `no-mentions.composer.spec.ts` (file does not exist — skipped)
- [x] 3.5 `no-forward.composer.spec.ts` (renamed from no-forwards)
- [x] 3.6 `no-antisemitism.composer.spec.ts`
- [x] 3.7 `no-obscene.composer.spec.ts`
- [x] 3.8 `warn-russian.composer.spec.ts`
- [x] 3.9 `warn-obscene.composer.spec.ts`
- [x] 3.10 `no-counteroffensive.composer.spec.ts`
- [x] 3.11 `no-channel-messages.composer.spec.ts`
- [x] 3.12 `strategic.composer.spec.ts`
- [x] 3.13 `swindlers.composer.spec.ts` (file does not exist — skipped)
- [x] 3.14 `nsfw-filter.composer.spec.ts`
- [x] 3.15 `nsfw-message-filter.composer.spec.ts`
- [x] 3.16 `denylist.composer.spec.ts`
- [x] 3.17 `feature-poll.composer.spec.ts`

## 4. Other Composer Tests (11 files)

- [x] 4.1 `before-any.composer.spec.ts`
- [x] 4.2 `hotline-security.composer.spec.ts`
- [x] 4.3 `join-leave.composer.spec.ts`
- [x] 4.4 `public-command.composer.spec.ts`
- [x] 4.5 Run all composer tests (`tests/bot/composers/**`) and fix any failures before continuing

## 5. Middleware Tests (14 files)

- [x] 5.1 `parse-entities.middleware.spec.ts` (no @testing imports — already clean)
- [x] 5.2 `parse-mentions.middleware.spec.ts` (no @testing imports — already clean)
- [x] 5.3 `parse-photo.middleware.spec.ts` (no @testing imports — already clean)
- [x] 5.4 `parse-urls.middleware.spec.ts` (no @testing imports — already clean)
- [x] 5.5 `parse-video-frames.middleware.spec.ts` (file does not exist — skipped)
- [x] 5.6 `admin-check-notify.spec.ts`
- [x] 5.7 `bot-active.middleware.spec.ts` (no @testing imports — already clean)
- [x] 5.8 `guard-middlewares.spec.ts` (no @testing imports — already clean)
- [x] 5.9 `global.middleware.spec.ts` (no @testing imports — already clean)
- [x] 5.10 `ignore-old.middleware.spec.ts` (no @testing imports — already clean)
- [x] 5.11 `log-parsed-photos.middleware.spec.ts` (no @testing imports — already clean)
- [x] 5.12 `redis.middleware.spec.ts` (no @testing imports — already clean)
- [x] 5.13 `delete-swindlers.middleware.spec.ts` (no @testing imports — already clean)
- [x] 5.14 `nested.middleware.spec.ts` (no @testing imports — already clean)

## 6. Command Tests (10 files)

- [x] 6.1 `command-setter.spec.ts` (no @testing imports — already clean)
- [x] 6.2 `language.command.spec.ts`
- [x] 6.3 `role.command.spec.ts`
- [x] 6.4 `settings.command.spec.ts`
- [x] 6.5 `start.command.spec.ts`
- [x] 6.6 `help.command.spec.ts`
- [x] 6.7 `rank.command.spec.ts`
- [x] 6.8 `statistics.command.spec.ts`
- [x] 6.9 `updates.command.spec.ts` (no @testing imports — already clean)

## 7. Plugin, Handler, Listener, and Bot-Level Tests (11 files)

- [x] 7.1 `auto-comment-reply.plugin.spec.ts`
- [x] 7.2 `chain-filters.plugin.spec.ts` (no @testing imports — already clean)
- [x] 7.3 `self-destructed.plugin.spec.ts`
- [x] 7.4 `message.handler.spec.ts` (no @testing imports — already clean)
- [x] 7.5 `test-tensor.listener.spec.ts` (no @testing imports — already clean)
- [x] 7.6 `alarm.message.spec.ts` (no @testing imports — already clean)
- [x] 7.7 `delete.message.spec.ts` (no @testing imports — already clean)
- [x] 7.8 `word-delete.message.spec.ts` (no @testing imports — already clean)
- [x] 7.9 `redis-session.spec.ts` (no @testing imports — already clean)
- [x] 7.10 `delete-message.transformer.spec.ts` (no @testing imports — already clean)
- [x] 7.11 `disable-logs-chat.transformer.spec.ts`

## 8. E2E Tests (2 files)

- [x] 8.1 `tests/edit-message.spec.ts`
- [x] 8.2 `tests/bot.spec.ts`

## 9. Remove src/testing/ and Update testing utilities test

- [x] 9.1 Migrate or delete `tests/testing/updates/updates.spec.ts` (tests the old mock update builders — either remove or rewrite against grammy-testing's low-level exports)
- [x] 9.2 Delete `src/testing/` directory
- [x] 9.3 Confirm zero references to `@testing/` remain in the codebase (`grep -r "@testing/" src/ tests/`)

## 10. Final Verification

- [x] 10.1 Run full test suite (`npm test`) — all 100 specs pass, 938 tests pass
- [x] 10.2 Run coverage (`npm run test:coverage`) — all thresholds (80% lines/functions/branches/statements) still met
- [x] 10.3 Run type-check (`npm run lint`) — zero TypeScript errors
