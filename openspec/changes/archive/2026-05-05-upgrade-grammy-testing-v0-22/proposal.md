## Why

The vendored `@grammyjs/testing` package is at v0.17.0 while the local `grammy-testing` repo is at v0.22.0. Staying current avoids compounding drift and gets the correctness fixes (independent `update_id` counter, proper N-message `sendMediaGroup` response shape) and the new `user.sendCallbackQuery` verb before future test work depends on it.

## What Changes

- Replace `vendor/grammyjs-testing-0.17.0.tgz` with a freshly built `vendor/grammyjs-testing-0.22.0.tgz`
- Update `package.json` devDependency reference from `file:vendor/grammyjs-testing-0.17.0.tgz` to `file:vendor/grammyjs-testing-0.22.0.tgz`
- Reinstall dependencies so both `package-lock.json` and `pnpm-lock.yaml` are updated
- Remove the redundant static `mockSendMessageResponse` in `tests/bot/plugins/self-destructed.plugin.spec.ts` — auto-derivation (available since v0.12.0) handles this correctly; the static mock is dead weight
- Run the full test suite and type checks; fix any failures caused by the upgrade

## Capabilities

### New Capabilities

- `grammy-testing-vendor-upgrade`: Process and constraints for building a tgz from the local `grammy-testing` source repo and vendoring it into the bot project

### Modified Capabilities

- `grammy-testing-integration`: The vendored package version changes from 0.17.0 to 0.22.0; the integration spec must reflect the new version and any updated API surface (e.g., `user.sendCallbackQuery` now available)

## Impact

- `vendor/` — old tgz removed, new one added
- `package.json` — devDependency reference updated
- `package-lock.json` and `pnpm-lock.yaml` — regenerated
- `tests/bot/plugins/self-destructed.plugin.spec.ts` — static `responses.sendMessage` mock removed
- All test files — runtime behavior verified against 0.22.0; no API removals expected
