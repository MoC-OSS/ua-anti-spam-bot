## MODIFIED Requirements

### Requirement: grammy-testing is the sole test infrastructure dependency

The project SHALL use `@grammyjs/testing` as the source of all bot-testing utilities. The `src/testing/` directory SHALL be removed and SHALL NOT be referenced in any test or source file. The vendored package version SHALL be 0.22.0.

#### Scenario: No src/testing imports remain

- **WHEN** the codebase is scanned for imports from `@testing/` or `src/testing/`
- **THEN** zero matches are found in any `.spec.ts` file

#### Scenario: grammy-testing is installed as a dev dependency at version 0.22.0

- **WHEN** `package.json` is inspected
- **THEN** `@grammyjs/testing` appears in `devDependencies` pointing to `file:vendor/grammyjs-testing-0.22.0.tgz`

## ADDED Requirements

### Requirement: user.sendCallbackQuery is available for callback query tests

The `user.sendCallbackQuery(data, options?)` verb SHALL be available for dispatching `callback_query` updates in tests. Tests that need to simulate a user tapping an inline keyboard button without a prior `Reply.clickButton` flow SHALL use this verb.

#### Scenario: sendCallbackQuery dispatches a callback_query update

- **WHEN** a test calls `await user.sendCallbackQuery('some-data')`
- **THEN** the bot receives a `callback_query` update with `data === 'some-data'` and no error is thrown

#### Scenario: sendCallbackQuery accepts an explicit message context

- **WHEN** a test calls `await user.sendCallbackQuery('some-data', { message: capturedMsg })`
- **THEN** the `callback_query.message` in the update matches the provided `capturedMsg`
