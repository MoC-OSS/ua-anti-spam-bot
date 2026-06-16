## REMOVED Requirements

### Requirement: grammy-testing tgz is built from local source and vendored

**Reason**: The package is now published to npm as `grammy-testing` (v0.26.0). The local-build-and-vendor workflow is superseded by a standard npm devDependency. Future upgrades SHALL be done by bumping the version range in `package.json` and running `npm install`.
**Migration**: Delete `vendor/grammyjs-testing-*.tgz` and the `vendor/` directory. Update `package.json` devDependencies to use `"grammy-testing": "^<version>"`. Run `npm install`.
