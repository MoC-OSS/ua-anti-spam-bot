## Why

The project was vendoring `@grammyjs/testing` as a local `.tgz` tarball (`vendor/grammyjs-testing-0.22.0.tgz`) because the package wasn't yet published to npm. The package is now published to npm as `grammy-testing` (v0.26.0), making the vendor workaround unnecessary and adding maintenance overhead.

## What Changes

- Remove `vendor/grammyjs-testing-0.22.0.tgz` and the `vendor/` directory
- Replace `"@grammyjs/testing": "file:vendor/grammyjs-testing-0.22.0.tgz"` in `package.json` devDependencies with `"grammy-testing": "^0.26.0"`
- Update all test file imports from `'@grammyjs/testing'` to `'grammy-testing'` (30+ files)

## Capabilities

### New Capabilities

_(none — this is a dependency migration with no new test capabilities)_

### Modified Capabilities

- `grammy-testing-integration`: Import path changes from `@grammyjs/testing` to `grammy-testing`; package version advances from 0.22.0 to 0.26.0
- `grammy-testing-vendor-upgrade`: Superseded — vendor mechanism removed entirely in favour of the npm-published package

## Impact

- **Dependencies**: `@grammyjs/testing` removed, `grammy-testing ^0.26.0` added as devDependency
- **Test files**: all `import ... from '@grammyjs/testing'` statements updated (30+ spec files under `tests/`)
- **Vendor directory**: `vendor/` deleted
- **package-lock.json**: regenerated to reflect the npm-resolved package
- **Runtime behaviour**: unchanged — public API is compatible across the version jump
