## 1. Dependency Update

- [x] 1.1 Replace `"@grammyjs/testing": "file:vendor/grammyjs-testing-0.22.0.tgz"` with `"grammy-testing": "^0.26.0"` in `package.json` devDependencies
- [x] 1.2 Run `npm install` to resolve `grammy-testing` from the npm registry

## 2. Import Migration

- [x] 2.1 Replace all `from '@grammyjs/testing'` import specifiers with `from 'grammy-testing'` in test files under `tests/`

## 3. Vendor Cleanup

- [x] 3.1 Delete `vendor/grammyjs-testing-0.22.0.tgz` and the `vendor/` directory

## 4. Verification

- [x] 4.1 Run the full test suite (`npm test`) and confirm all 100 test files / 938 tests pass
