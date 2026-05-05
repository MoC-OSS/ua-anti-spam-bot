## 1. Vendor upgrade

- [x] 1.1 Pack grammy-testing v0.16.0 from `/Users/master/Documents/Projects/own/grammy-testing` into `vendor/grammyjs-testing-0.16.0.tgz`
- [x] 1.2 Update `package.json` dev dependency reference from v0.14.0 to v0.16.0
- [x] 1.3 Run `npm install` and verify `package-lock.json` reflects v0.16.0
- [x] 1.4 Delete `vendor/grammyjs-testing-0.14.0.tgz`
- [x] 1.5 Run `npm run test:run` — all tests must pass before proceeding

## 2. Migrate `edit-message.spec.ts`

- [x] 2.1 Capture the `Message` returned by `user.sendText('not a card')` in the "should remove the message if it has been edited" test
- [x] 2.2 Replace `user.editMessage(1, ...)` with `user.editMessage(msg.message_id, ...)`
- [x] 2.3 Run the file's tests — 3/3 must pass

## 3. Migrate `auto-comment-reply.plugin.spec.ts`

- [x] 3.1 Add `group.postRelayMessage('channel post')` before `user.sendText` in the relay test; capture the returned `Message` as `relay`
- [x] 3.2 Clear `chats.outgoing` after the relay dispatch (between relay and user sends) so the assertion only sees the user-message response
- [x] 3.3 Replace the inline `reply_to_message: { ... } as any` block with `reply_to_message: relay`
- [x] 3.4 Update the assertion to use `relay.message_id` instead of the hardcoded `100`
- [x] 3.5 Run the file's tests — 2/2 must pass

## 4. Update spec and run full quality gate

- [x] 4.1 Run full quality gate: `npm run typecheck && npm run lint && npm run test:run && npm run test:coverage`
- [x] 4.2 Update `openspec/specs/grammy-testing-integration/spec.md`: apply the MODIFIED "Updates are dispatched via actor verbs" requirement and ADDED "Actor verb sends return the dispatched Message" requirement from the delta spec
