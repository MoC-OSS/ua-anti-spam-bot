## Why

The bot ships its own test infrastructure (`src/testing/`) that replicates patterns now formalised in the external `grammy-testing` library. Consolidating onto the library removes duplicated code, adds test capabilities that are currently impossible (deletion tracking, button interaction, edit tracking, richer per-user reply inspection), and positions tests to use a maintained, versioned dependency rather than hand-rolled utilities.

## What Changes

- Add `vendor/grammyjs-testing-0.10.0.tgz` to the repository and reference it as a `file:` dev dependency in `package.json`
- Add `vendor/` to `.dockerignore` so the tarball is excluded from production image builds
- Remove `src/testing/` (prepareBotForTesting, OutgoingRequests, mock update builders) and replace with `@grammyjs/testing` imports
- Replace `bot.handleUpdate(new MessageMockUpdate(...).build())` dispatch pattern with `user.sendText()` / `user.sendCommand()` actor verbs across all test files
- Replace `outgoingRequests.getLast()?.payload` inspection with `user.replies.last` / `chats.outgoing` API
- Replace `prepareBotForTesting(bot, { getChat: {} })` with `prepareBot(bot, { responses: { getChat: {} } })`
- Replace manual `new Bot('mock') + prepareBotForTesting` boilerplate in composer tests with `prepareComposer(composer, options)` from the library
- Keep `mockSession` / `mockChatSession` / `mockState` call sites unchanged (identical API — import path changes only)
- Add `chats.deletionsFor(chat)` assertions where tests previously only checked `getMethods()` included `'deleteMessage'`

## Capabilities

### New Capabilities

- `grammy-testing-integration`: Vendoring `@grammyjs/testing@0.10.0` as a committed tarball, wiring it as a dev dependency, removing `src/testing/`, and updating all imports and test patterns across the test suite.

### Modified Capabilities

_(none — no spec-level behaviour of the bot changes; this is a test-infrastructure replacement)_

## Impact

- **Dev dependency added**: `@grammyjs/testing@0.10.0` via `file:./vendor/grammyjs-testing-0.10.0.tgz`
- **Vendor directory added**: `vendor/grammyjs-testing-0.10.0.tgz` committed to the repo (same pattern as `nsfwjs` in `src/packages/`)
- **Docker**: unaffected — `npm ci --omit=dev` skips all devDependencies; the tarball is excluded from the image via `.dockerignore`
- **CI**: unaffected — `npm ci` resolves from the committed tarball in `vendor/`; no registry access needed for this package
- **Removed**: `src/testing/` directory (6 files)
- **Modified**: all 101 `*.spec.ts` files — import paths and dispatch/assertion patterns; `.dockerignore` (one line added)
- **No production code changes**: `src/bot/`, `src/services/`, `src/server/` are untouched
- **No behaviour changes**: tests cover the same scenarios; some gain stronger assertions (deletion back-references, edit tracking)

## Known library limitations (tracked in grammy-testing TODO)

Two items documented in grammy-testing's TODO.md for future versions:

- **#13 No `chats.clear()`**: `beforeEach` resets currently require separate `clear()` calls per log (`outgoing`, `replies`, `deletionsFor`, `editsFor`, `actionsFor`). Workaround: extract a helper function in each test file.
- **#14 Unregistered chat silent miss**: bot replies to external chats (log channel, creator chat) are captured in `chats.outgoing` but produce no entry in `user.replies`. Workaround: assert via `chats.outgoing` for those specific calls.
