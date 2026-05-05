## ADDED Requirements

### Requirement: grammy-testing tgz is built from local source and vendored

When upgrading `@grammyjs/testing`, the project SHALL build a new `.tgz` from the local `grammy-testing` source repository using `npm run build && npm pack`, copy the output to `vendor/`, and update the `package.json` devDependency reference. The old `.tgz` SHALL be deleted from `vendor/`.

#### Scenario: Build produces a correctly versioned tgz

- **WHEN** `npm run build && npm pack` is run in the local `grammy-testing` repo
- **THEN** a `grammyjs-testing-<version>.tgz` file is produced with `version` matching `package.json` in that repo

#### Scenario: Only the current tgz exists in vendor

- **WHEN** `vendor/` is inspected after the upgrade
- **THEN** exactly one `grammyjs-testing-*.tgz` file exists and its version matches the `@grammyjs/testing` devDependency in `package.json`

#### Scenario: package.json references the new tgz

- **WHEN** `package.json` is inspected
- **THEN** `devDependencies["@grammyjs/testing"]` equals `"file:vendor/grammyjs-testing-<version>.tgz"` with the new version

#### Scenario: Both lock files are updated

- **WHEN** `pnpm install` is run after the tgz swap
- **THEN** both `package-lock.json` and `pnpm-lock.yaml` reflect the new `@grammyjs/testing` version with no unresolved conflicts

---

### Requirement: Test response mocks use auto-derivation, not static overrides

Tests SHALL NOT provide a static `sendMessage` response via `prepareBot({ responses: { sendMessage: ... } })` when the only reason is to give the plugin a `message_id` to delete. `@grammyjs/testing` auto-derives a valid `Message` response for `sendMessage` automatically; static overrides SHALL only be present when the test needs to assert on the specific content of the response (e.g., specific text, specific `message_id` value).

#### Scenario: self-destructed plugin test uses auto-derivation

- **WHEN** `tests/bot/plugins/self-destructed.plugin.spec.ts` is inspected
- **THEN** no static `sendMessage` response is passed to `prepareBot` and the delete-after-timeout assertions still pass
