## Context

`@grammyjs/testing` is vendored as a local `.tgz` rather than published to npm. The source lives at `/Users/master/Documents/Projects/own/grammy-testing` (version 0.22.0, dist already built). The bot project currently vendors v0.17.0 and references it via `"file:vendor/grammyjs-testing-0.17.0.tgz"` in `package.json`. Both `package-lock.json` and `pnpm-lock.yaml` are tracked and must be regenerated together.

API changes between 0.17.0 and 0.22.0 are additive and internally correct:
- 0.18.0: independent `update_id` counter; `sendMediaGroup` returns N messages; `GROUP_ANONYMOUS_BOT` comment fix
- 0.19.0: `user.sendCallbackQuery(data, options?)` added; `clickButton` populates `reply_markup`
- 0.20.0–0.22.0: examples, README, VitePress docs only — zero API changes

One existing test uses a redundant static `sendMessage` response mock (`tests/bot/plugins/self-destructed.plugin.spec.ts`). Auto-derivation (available since v0.12.0) handles this correctly; the static mock predates auto-derivation and was never removed.

## Goals / Non-Goals

**Goals:**

- Replace the vendored tgz with a freshly built 0.22.0 artefact from the local source repo
- Keep both lock files consistent after the swap
- Remove the `mockSendMessageResponse` dead weight from `self-destructed.plugin.spec.ts`
- Verify the full test suite and type checks pass against 0.22.0

**Non-Goals:**

- Publishing `@grammyjs/testing` to npm
- Adding new test coverage using `user.sendCallbackQuery` (that belongs to a future change)
- Upgrading any other dependency as part of this change

## Decisions

### Build from the already-present dist rather than re-running tsup

The `dist/` in the grammy-testing repo is current (built from the 0.22.0 source). `npm pack` reads from `dist/` directly via the `files` field in `package.json`. Re-running `npm run build` (tsup) is fast and cheap — we do it anyway to guarantee freshness — but it is not strictly required if the dist is already current.

**Alternative considered**: copy an older pre-built tgz (0.18.0 or 0.19.0 exist in the repo). Rejected — these are not 0.22.0 and would leave a gap.

### Single pack-and-copy step, not a workspace link

A `file:` reference to the `.tgz` is the established pattern in this project. Switching to a workspace link or a path reference (`file:../../grammy-testing`) would work at install time but creates a runtime dependency on the local source directory, which breaks CI. Keeping the tgz model is correct.

### Remove the static `sendMessage` mock without replacing it

The `selfDestructedReply` plugin calls `ctx.reply()`, receives a `Message` from grammy-testing's auto-derivation (which generates a valid `message_id`), and uses that id to schedule `deleteMessage`. The test only asserts that `deleteMessage` is called — it does not assert on which id. The static mock is therefore safe to delete outright.

## Risks / Trade-offs

- [Lock file divergence] `pnpm install` regenerates both lock files simultaneously; running `npm install` instead would only update `package-lock.json`. → Always use `pnpm install` after the swap.
- [sendMediaGroup response shape] 0.18.0 changed `sendMediaGroup` API response to return N messages. The bot's tests send media groups as incoming updates and don't assert on the response; the change is transparent. → No mitigation needed, but verified during test run.
- [Old tgz stays in git history] The 0.17.0 tgz is a binary in git history; replacing it adds another binary commit. → Accepted — this is the existing trade-off for the vendor approach.

## Migration Plan

1. In the grammy-testing repo: `npm run build && npm pack` → produces `grammyjs-testing-0.22.0.tgz`
2. Copy tgz to `vendor/`; delete `vendor/grammyjs-testing-0.17.0.tgz`
3. Update `package.json`: `"@grammyjs/testing": "file:vendor/grammyjs-testing-0.22.0.tgz"`
4. Run `pnpm install` to regenerate both lock files
5. Remove the static mock from `self-destructed.plugin.spec.ts`
6. Run `pnpm test` and `pnpm typecheck`; fix any failures
7. Bump version if required by project convention

Rollback: restore the old tgz from git, revert `package.json`, re-run `pnpm install`.
