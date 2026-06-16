## MODIFIED Requirements

### Requirement: grammy-testing is the sole test infrastructure dependency

The project SHALL use `grammy-testing` as the source of all bot-testing utilities. The `src/testing/` directory SHALL be removed and SHALL NOT be referenced in any test or source file. The package SHALL be resolved from the npm registry at version `^0.26.0`.

#### Scenario: No src/testing imports remain

- **WHEN** the codebase is scanned for imports from `@testing/` or `src/testing/`
- **THEN** zero matches are found in any `.spec.ts` file

#### Scenario: grammy-testing is installed as a dev dependency from npm

- **WHEN** `package.json` is inspected
- **THEN** `grammy-testing` appears in `devDependencies` with a caret semver range (e.g. `^0.26.0`), not a `file:` reference

#### Scenario: No @grammyjs/testing imports remain

- **WHEN** the codebase is scanned for imports from `@grammyjs/testing`
- **THEN** zero matches are found in any `.spec.ts` or `.ts` file

## REMOVED Requirements

### Requirement: grammy-testing tgz is built from local source and vendored

**Reason**: The package is now published to npm as `grammy-testing`; building and vendoring a local tarball is no longer required.
**Migration**: Remove `vendor/grammyjs-testing-*.tgz` and the `vendor/` directory. Replace the `file:` devDependency with `"grammy-testing": "^0.26.0"` and run `npm install`.
