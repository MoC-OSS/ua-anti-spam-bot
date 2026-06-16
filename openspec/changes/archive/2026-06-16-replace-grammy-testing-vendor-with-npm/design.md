## Context

The project previously consumed `@grammyjs/testing` from a local vendor tarball (`vendor/grammyjs-testing-0.22.0.tgz`) because the package had not yet been published to npm. The package is now published by the author as `grammy-testing` on npm (v0.26.0). The vendor tarball approach required manual tarball management, a dedicated `vendor/` directory in source control, and a non-standard `file:` dependency reference.

## Goals / Non-Goals

**Goals:**
- Remove the vendor directory and tarball from the repository
- Resolve `grammy-testing` from npm like any other devDependency
- Keep the test suite green with no behaviour changes

**Non-Goals:**
- Adopting any new `grammy-testing` v0.26.0 API features beyond what was already available
- Changing test logic or coverage
- Updating any production dependencies

## Decisions

**Rename import specifier from `@grammyjs/testing` to `grammy-testing`**

The npm package is published under a different name (`grammy-testing`, no scope) rather than as `@grammyjs/testing`. A global search-and-replace across all spec files is the only change required — the exported symbols (`prepareBot`, `Channel`, `Chats`, `Supergroup`, `User`, etc.) are identical.

Alternatives considered:
- Re-publish under `@grammyjs/testing` on npm — not viable; the scope is controlled by the grammyjs org.
- Use an npm alias (`"@grammyjs/testing": "npm:grammy-testing@^0.26.0"`) — avoids renaming imports but hides the real package name and adds confusion. Rejected in favour of an honest rename.

**Use `^0.26.0` version range**

Pins to the current published version with caret semver to receive patch/minor updates automatically. Since the package is still in `0.x`, minor bumps may be breaking; the range is acceptable because the package author controls both this repo and the npm release.

## Risks / Trade-offs

- [Semver instability in 0.x] `^0.26.0` allows minor version bumps that could break under 0.x semver rules → Mitigation: author controls both repos; breaking changes would surface in CI immediately.
- [Import rename churn] 30+ test files required import path changes → Mitigation: mechanical sed replacement, verified by a passing test suite.

## Migration Plan

1. Update `package.json` devDependency entry
2. Replace all `'@grammyjs/testing'` import strings with `'grammy-testing'` in test files
3. Run `npm install` to resolve from npm registry
4. Delete `vendor/grammyjs-testing-0.22.0.tgz` and `vendor/`
5. Run full test suite to confirm green

Rollback: revert `package.json`, restore the tarball from git history, revert import strings, run `npm install`.
