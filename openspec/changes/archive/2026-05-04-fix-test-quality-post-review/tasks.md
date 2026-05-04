## 1. Replace respondNext membership overrides with dedicated actors

- [x] 1.1 In `tests/bot/commands/public/settings.command.spec.ts`: add `regularUser` declared alongside `user`, `owner`, `admin2`; register with `group.join(regularUser)` in `beforeAll`; replace the `respondNext` call at line 116 with `regularUser.sendCommand('/settings', undefined, { chat: group })`
- [x] 1.2 In `tests/bot/commands/public/role.command.spec.ts`: add `regularUser` declared alongside `user`; register with `group.join(regularUser)` in `beforeAll`; replace the `respondNext` call at line 69 with `regularUser.sendCommand('/role', 'user', { chat: group })`

## 2. Adopt chats.clear() in all beforeEach blocks

- [x] 2.1 Replace triple-clear in `tests/bot/composers/messages/no-channel-messages.composer.spec.ts` (two `beforeEach` blocks, lines 57–61 and 123–127)
- [x] 2.2 Replace triple-clear in `tests/bot/composers/messages/denylist.composer.spec.ts`
- [x] 2.3 Replace triple-clear in `tests/bot/composers/messages/no-russian.composer.spec.ts`
- [x] 2.4 Replace triple-clear in `tests/bot/composers/messages/no-antisemitism.composer.spec.ts`
- [x] 2.5 Replace triple-clear in `tests/bot/composers/messages/no-counteroffensive.composer.spec.ts`
- [x] 2.6 Replace triple-clear in `tests/bot/composers/messages/no-forward.composer.spec.ts`
- [x] 2.7 Replace triple-clear in `tests/bot/composers/messages/no-locations.composer.spec.ts`
- [x] 2.8 Replace triple-clear in `tests/bot/composers/messages/no-obscene.composer.spec.ts`
- [x] 2.9 Replace triple-clear in `tests/bot/composers/messages/warn-obscene.composer.spec.ts`
- [x] 2.10 Replace triple-clear in `tests/bot/composers/messages/warn-russian.composer.spec.ts`
- [x] 2.11 Replace triple-clear in `tests/bot/composers/messages/nsfw-filter.composer.spec.ts`
- [x] 2.12 Replace triple-clear in `tests/bot/composers/messages/nsfw-message-filter.composer.spec.ts`
- [x] 2.13 Replace triple-clear in `tests/bot/composers/messages/strategic.composer.spec.ts`
- [x] 2.14 Replace triple-clear in `tests/bot/composers/messages/feature-poll.composer.spec.ts`
- [x] 2.15 Replace triple-clear in `tests/bot/composers/before-any.composer.spec.ts`
- [x] 2.16 Replace triple-clear in `tests/bot/composers/hotline-security.composer.spec.ts`
- [x] 2.17 Replace triple-clear in `tests/bot/composers/join-leave.composer.spec.ts`
- [x] 2.18 Replace triple-clear in `tests/bot/composers/public-command.composer.spec.ts`
- [x] 2.19 Replace triple-clear in `tests/bot/commands/private/rank.command.spec.ts`
- [x] 2.20 Replace triple-clear in `tests/bot/commands/private/statistics.command.spec.ts`
- [x] 2.21 Replace triple-clear in `tests/bot/commands/public/help.command.spec.ts`
- [x] 2.22 Replace triple-clear in `tests/bot/commands/public/language.command.spec.ts`
- [x] 2.23 Replace triple-clear in `tests/bot/commands/public/role.command.spec.ts`
- [x] 2.24 Replace triple-clear in `tests/bot/commands/public/settings.command.spec.ts`
- [x] 2.25 Replace triple-clear in `tests/bot/commands/public/start.command.spec.ts`
- [x] 2.26 Replace triple-clear in `tests/bot/middleware/admin-check-notify.spec.ts`
- [x] 2.27 Replace triple-clear in `tests/bot/plugins/auto-comment-reply.plugin.spec.ts`
- [x] 2.28 Replace triple-clear in `tests/bot/plugins/self-destructed.plugin.spec.ts`
- [x] 2.29 Replace triple-clear in `tests/bot/queries/bot-queries.spec.ts`
- [x] 2.30 Replace triple-clear in `tests/edit-message.spec.ts`
- [x] 2.31 Replace triple-clear in `tests/bot.spec.ts`

## 3. Fix redundant ?.method assertions in no-channel-messages.composer.spec.ts

- [x] 3.1 In the "should delete message from a channel" test: remove `getAll<>()` destructuring and the three `?.method` assertions; replace with `expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods([...]))` matching the actual 4-method sequence
- [x] 3.2 In the "should delete message but not notify if disableDeleteMessage is true" test: apply the same refactor for its 3-method sequence
- [x] 3.3 Verify no other tests in the file use redundant `?.method` assertions

## 4. Standardise toHaveLength calls in bot.spec.ts

- [x] 4.1 Change `expect(chats.outgoing.requests).toHaveLength(0)` → `expect(chats.outgoing).toHaveLength(0)` (line 95)
- [x] 4.2 Change `expect(chats.outgoing.requests).toHaveLength(5)` → `expect(chats.outgoing).toHaveLength(5)` (line 116)
- [x] 4.3 Change `expect(chats.outgoing.requests).toHaveLength(4)` → `expect(chats.outgoing).toHaveLength(4)` (line 136)
- [x] 4.4 Change `expect(chats.outgoing.requests).toHaveLength(2)` → `expect(chats.outgoing).toHaveLength(2)` (line 212)
- [x] 4.5 Change `expect(chats.outgoing.requests).toHaveLength(1)` → `expect(chats.outgoing).toHaveLength(1)` (line 220)

## 5. Add app-state resets in admin-check-notify.spec.ts

- [x] 5.1 Add `state.isDeleted = false` to the `beforeEach` block
- [x] 5.2 Add `chatSession.chatSettings.enableAdminCheck = false` to the `beforeEach` block as the stable per-test default (tests that require it enabled set it explicitly)

## 6. Verify

- [x] 6.1 Run `pnpm test` (or `npx vitest run`) and confirm all tests pass with no regressions

## 7. Quality gate

- [x] 7.1 Run `npm run lint:js:fix` — auto-fix safe lint issues
- [x] 7.2 Run `npm run format:md` — format Markdown files (design.md updated)
- [x] 7.3 Run `npm run typecheck` — exits 0
- [x] 7.4 Run `npm run lint:js` — exits 0
- [x] 7.5 Run `npm run test` — 938/938 tests pass
- [x] 7.6 Run `npm run test:coverage` — 89.41% statements, 81.96% branches, 87.63% functions, 89.63% lines (all ≥ 80%)

## 8. Version bump

- [x] 8.1 Bump `version` in `package.json` from `1.8.0` → `1.8.1` (patch: test-only change, no production code modified)
