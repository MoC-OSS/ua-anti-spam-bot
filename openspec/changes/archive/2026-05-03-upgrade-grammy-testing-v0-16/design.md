## Context

The test suite currently uses grammy-testing v0.14.0 (vendored as
`vendor/grammyjs-testing-0.14.0.tgz`). Two test patterns were known limitations:

1. **Magic messageId** — `user.editMessage(1, ...)` relied on `IdGenerator` starting at 1.
   The sendText return type was `void`, so the ID was not observable.
2. **`as any` relay cast** — `reply_to_message: { from: { id: 777_000 }, ... } as any`
   required constructing the full `Message` shape manually because `reply_to_message` was
   typed as `Message` (not `Partial<Message>`).

v0.16.0 resolves both: actor sends return `Promise<Message>`, and `group.postRelayMessage()`
dispatches the relay update and returns a properly-typed `Message`.

## Goals / Non-Goals

**Goals:**
- Upgrade vendor to v0.16.0 and confirm all 938 tests still pass
- Replace the magic `1` in `editMessage` with the actual returned `message_id`
- Replace the `as any` relay block with `postRelayMessage` + typed `reply_to_message`
- Update the grammy-testing-integration spec to document the new canonical patterns

**Non-Goals:**
- Migrating any other test patterns not directly unlocked by v0.16.0
- Changing bot behavior or non-test source files

## Decisions

**D1: Use `postRelayMessage` to set up context, then `user.sendText` to trigger the bot**

`postRelayMessage` dispatches a real bot update, which means the bot's `:text` handler fires
for the relay message too. The test checks `chats.outgoing.getLast()` which returns the last
outgoing call — that will always be the bot's response to the user's message (the one with
`reply_to_message_id`). The relay dispatch's own bot response will be an earlier entry.

Alternative considered: skip `postRelayMessage` and only use the typed `reply_to_message` option
with `{ from: { id: 777_000 }, message_id: 100, text: '...' }` (no `as any` needed in v0.16.0).
Rejected because `postRelayMessage` is the idiomatic actor-verb pattern and better exercises the
full flow; it also means the test no longer hard-codes `777_000` inline.

**D2: Clear `chats.outgoing` between relay dispatch and user send**

Since `postRelayMessage` adds calls to `chats.outgoing`, clearing outgoing after the relay
dispatch keeps the assertion focused on the user's message only. Alternatively, `getLast` is
sufficient if we trust ordering — but explicit clear is more robust and readable.

**D3: Keep `message_id: 100` or let it auto-generate?**

The assertion `expect(reply_to_message_id).toBe(100)` is currently hardcoded. With
`postRelayMessage` returning the `Message`, the assertion can use `relay.message_id` instead
of a literal — removing the hardcoded assumption. Use the auto-generated ID.

## Risks / Trade-offs

- **postRelayMessage triggers bot handlers** — The relay message itself triggers `bot.on(':text')`.
  This is correct behavior (mirrors real Telegram) but adds an extra outgoing entry before the
  user's message. Cleared with `chats.outgoing.clear()` between the two sends.
  → Mitigation: clear outgoing after relay dispatch.

- **v0.16.0 packing** — The tgz must be packed from the grammy-testing source before the bot
  package can be updated. If the pack step is skipped, `npm install` will fail.
  → Mitigation: task 1.1 packs before any package.json change.
