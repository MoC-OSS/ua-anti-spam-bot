## ADDED Requirements

### Requirement: Test response mocks use auto-derivation, not static overrides

Tests SHALL NOT provide a static `sendMessage` response via `prepareBot({ responses: { sendMessage: ... } })` when the only reason is to give the plugin a `message_id` to delete. `@grammyjs/testing` auto-derives a valid `Message` response for `sendMessage` automatically; static overrides SHALL only be present when the test needs to assert on the specific content of the response (e.g., specific text, specific `message_id` value).

#### Scenario: self-destructed plugin test uses auto-derivation

- **WHEN** `tests/bot/plugins/self-destructed.plugin.spec.ts` is inspected
- **THEN** no static `sendMessage` response is passed to `prepareBot` and the delete-after-timeout assertions still pass
