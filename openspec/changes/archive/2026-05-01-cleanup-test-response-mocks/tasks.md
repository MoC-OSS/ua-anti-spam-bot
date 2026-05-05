## 1. Group A — Remove `getChat`-only responses blocks (14 files)

- [x] 1.1 Remove `responses: { getChat: ... }` block from `tests/edit-message.spec.ts`
- [x] 1.2 Remove `responses: { getChat: {} }` block from `tests/bot.spec.ts`
- [x] 1.3 Remove `responses: { getChat: {} as any }` block from `tests/bot/composers/messages/feature-poll.composer.spec.ts`
- [x] 1.4 Remove `responses` block from `tests/bot/composers/messages/no-locations.composer.spec.ts`
- [x] 1.5 Remove `responses` block from `tests/bot/composers/messages/no-russian.composer.spec.ts`
- [x] 1.6 Remove `responses` block from `tests/bot/composers/messages/denylist.composer.spec.ts`
- [x] 1.7 Remove `responses` block from `tests/bot/composers/messages/no-antisemitism.composer.spec.ts`
- [x] 1.8 Remove `responses` block from `tests/bot/composers/messages/warn-obscene.composer.spec.ts`
- [x] 1.9 Remove `responses` block from `tests/bot/composers/messages/no-obscene.composer.spec.ts`
- [x] 1.10 Remove `responses` block from `tests/bot/composers/messages/no-counteroffensive.composer.spec.ts`
- [x] 1.11 Remove `responses` block from `tests/bot/composers/messages/nsfw-filter.composer.spec.ts`
- [x] 1.12 Remove `responses` block from `tests/bot/composers/messages/nsfw-message-filter.composer.spec.ts`
- [x] 1.13 Remove `responses` block from `tests/bot/composers/messages/warn-russian.composer.spec.ts`
- [x] 1.14 Remove `responses: { getChat: { invite_link: '' } }` argument from `prepareBot` call in `tests/bot/composers/messages/no-forward.composer.spec.ts`

## 2. Group B — Remove responses + add `group.own(user)` (6 files)

- [x] 2.1 In `tests/bot/composers/before-any.composer.spec.ts`: remove `responses` block, add `group.own(user)` after user and group creation in `beforeAll`
- [x] 2.2 In `tests/bot/commands/public/language.command.spec.ts`: remove `responses` block, add `group.own(user)` after user and group creation in `beforeAll`
- [x] 2.3 In `tests/bot/commands/public/role.command.spec.ts`: remove `responses` block, add `group.own(user)` after user and group creation in `beforeAll`
- [x] 2.4 In `tests/bot/middleware/admin-check-notify.spec.ts`: remove `responses` block (both `getChatMember` and `getChat`), add `group.own(user)` after user and group creation in `beforeAll`
- [x] 2.5 In `tests/bot/commands/public/help.command.spec.ts`: remove `responses` block (both `getChatMember` and `getChatAdministrators: []`), add `group.own(user)` after user and group creation in `beforeAll`
- [x] 2.6 In `tests/bot/composers/public-command.composer.spec.ts`: remove entire `responses` block (includes `getChatMember` and the 40-line `getChatAdministrators` array), add `group.own(user)` after user and group creation in `beforeAll`

## 3. Group C1 — Dead `chatAdmins` removal (`start.command.spec.ts`)

- [x] 3.1 In `tests/bot/commands/public/start.command.spec.ts`: delete the `chatAdmins` constant, remove `responses` block, add `group.own(user)` after user and group creation in `beforeAll`

## 4. Group D — Mixed multi-`prepareBot` case (`strategic.composer.spec.ts`)

- [x] 4.1 Remove `responses: { getChat: { invite_link: '' }, getChatAdministrators: [] }` from the main `prepareBot` call in `tests/bot/composers/messages/strategic.composer.spec.ts`
- [x] 4.2 In the sub-test that creates `failBot`/`failChats`: create a named user actor `const adminUser = failChats.newUser({ id: 1, first_name: 'Admin', username: 'admin', is_bot: false })`, call `failGroup.own(adminUser)`, then remove `getChatAdministrators` from that `prepareBot` call
- [x] 4.3 Remove the remaining `responses: { getChat: { invite_link: '' } }` blocks from the other sub-test `prepareBot` calls in `strategic.composer.spec.ts`

## 5. Group C2 — Refactor user setup with specific IDs (`settings.command.spec.ts`)

- [x] 5.1 In `tests/bot/commands/public/settings.command.spec.ts`: replace `user = chats.newUser()` with two named actors: `const owner = chats.newUser({ id: 1_111_111, first_name: 'GrammyMock FirstName', last_name: 'GrammyMock LastName', username: 'GrammyMock_Username' })` and `const admin2 = chats.newUser({ id: 1_111_112, first_name: 'GrammyMock FirstName2', last_name: 'GrammyMock LastName2', username: 'GrammyMock_Username2' })`
- [x] 5.2 Set `user = owner` so existing `user.sendCommand(...)` call sites remain unchanged
- [x] 5.3 Add `group.own(owner)` and `group.promote(admin2)` after group creation in `beforeAll`
- [x] 5.4 Remove the `chatAdmins` constant and the `responses` block from `prepareBot`
- [x] 5.5 Update spy assertions to reference `owner.id` and `admin2.id` instead of `chatAdmins[0].user.id` / `chatAdmins[1].user.id`

## 6. Verification

- [x] 6.1 Run `pnpm test` and confirm 0 test failures
