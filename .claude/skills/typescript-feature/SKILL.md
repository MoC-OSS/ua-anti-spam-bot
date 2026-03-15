---
name: typescript-feature
description: A comprehensive checklist and workflow for implementing or updating TypeScript features in this repository, covering design, implementation, testing, documentation, and versioning.
version: 1.2.0
---

# TypeScript Boilerplate - Feature Checklist

You are implementing or changing a feature in this repository.
Every task you perform must follow the full workflow described below, without exception.
Do not stop until all required checks pass cleanly.

> Scope rule: Make changes inside this repository only unless the user explicitly asks you to modify files elsewhere.

> Safety rule: Do not weaken TypeScript, ESLint, Prettier, or Vitest coverage rules just to get a task through the quality gate.

## Project context

| Item                | Value                                                  |
| ------------------- |--------------------------------------------------------|
| Root                | `.`                                                    |
| Runtime             | Node.js 24.x                                           |
| Package manager     | `npm`                                                  |
| Main source         | `src/`                                                 |
| Tests               | `tests/`                                               |
| Type checker        | `npm run typecheck`                                    |
| Lint                | `npm run lint`                                         |
| Unit tests          | `npm run test:run`                                     |
| Coverage            | `npm run test:coverage`                                |
| Markdown formatting | `npm run format:md`                                    |
| Optional auto-fix   | `npm run lint:fix`                                     |
| Build               | `npm build` if a build script exists in `package.json` |

## Mandatory implementation workflow

Work through each step in order. Complete the current step fully before moving to the next.

### Step 1 - Understand the requirement

- Restate in one sentence what the feature or fix does.
- Identify every file that must be created or modified before editing.
- Read `package.json` before making assumptions about scripts or tooling.
- If the change touches repo conventions, inspect the relevant config first: `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, and any related files under `.eslint/`.

### Step 2 - Design first

- Decide which modules, functions, classes, or scripts own the change before writing code.
- Prefer small, composable units with explicit input and output types.
- Define or refine domain types before implementation when the change introduces new shapes or states.
- Decide how the change will be tested before writing the implementation.

### Step 3 - Implement the code

Follow these rules unconditionally:

#### General TypeScript style

- Keep TypeScript strict. Do not loosen compiler settings or lint rules.
- Do not introduce `any`. If a value is unknown, use `unknown` and narrow it safely.
- Prefer explicit return types when they improve readability or protect public APIs.
- Prefer domain types, discriminated unions, generics, type guards, and `satisfies` over assertions.
- Avoid unsafe casts. If a cast is unavoidable, keep it local and make the surrounding code prove why it is safe.
- Keep functions focused, names precise, and control flow easy to follow.
- Prefer immutable updates unless mutation is clearly simpler and safe.

#### Documentation rules

- Add JSDoc to exported functions and to non-trivial internal functions where intent or side effects are not obvious.
- JSDoc should cover purpose, parameters, return value, and notable errors or side effects when relevant.

#### File placement rules

- Production code belongs under `src/`.
- Tests belong under `tests/`.
- Keep test filenames on the Vitest convention with a `.spec.ts` suffix when adding new tests for this repository.

### Step 4 - Add or update tests

Every behavior change needs tests unless the user explicitly asks for a docs-only or config-only change.

#### Required test structure

- Use a root `describe` named after the service, class, script, or module under test.
- Create a separate nested `describe` for each method or function.
- Split positive and negative cases into nested `describe` blocks.
- Cover both happy paths and failure paths that are realistic for the change.
- Do not delete or skip tests to make the suite pass.

#### Coverage gate - 80% minimum

The project enforces 80% coverage thresholds through `vitest.config.ts`.
Current thresholds:

```ts
thresholds: {
  lines: 80,
  functions: 80,
  branches: 80,
  statements: 80,
}
```

When adding new code, ensure the corresponding tests keep the repository at or above those thresholds.

### Step 5 - Run the full quality gate

Execute the following commands from the repository root in this exact order.
Fix every error before moving to the next command.

```bash
# 1. Auto-fix safe lint issues when available
npm run lint:fix

# 2. Format Markdown when Markdown changed
npm run format:md

# 3. Type check
npm run typecheck

# 4. Lint
npm run lint

# 5. Tests
npm run test:run

# 6. Tests with coverage
npm run test:coverage
```

If `package.json` includes a build script, run the repository build command after the checks above and fix build failures before finishing.

#### Fixing TypeScript and ESLint issues

- Fix root causes, not symptoms.
- Do not bypass failures with `@ts-ignore`, disabled lint rules, or relaxed config unless the user explicitly asks for that tradeoff.
- Do not leave warnings, type errors, or failing tests for later.

### Step 6 - Update README when the change is important

Review `README.md` after implementation and update it whenever the change affects any of the following:

- public behavior or usage
- setup or installation steps
- important scripts or developer workflow
- file structure or documented extension points

If none of the above apply, no README update is needed, but you must explicitly confirm that.

### Step 7 - Bump the version

Increment the `version` field in `package.json` after the implementation and documentation updates are complete.

#### Semantic Versioning

Increment the `version` field in `package.json` using Semantic Versioning:

| Change type                                           | Version segment to bump |
| ----------------------------------------------------- | ----------------------- |
| Breaking change                                       | `major`                 |
| Backward-compatible feature                           | `minor`                 |
| Bug fix, refactor, docs-only, test-only, tooling-only | `patch`                 |

Rules:

- When bumping `major`, reset `minor` and `patch` to `0`.
- When bumping `minor`, reset `patch` to `0`.
- Never skip a segment.
- `package.json` is the source of truth for the project version.

### Step 8 - Self-review checklist

Before declaring the task complete, verify each item:

- [ ] `package.json` was reviewed before implementation
- [ ] New or changed TypeScript keeps strict typing and introduces no `any`
- [ ] Types, control flow, and boundaries are modeled clearly
- [ ] JSDoc was added where required
- [ ] Tests were added or updated in `tests/` for behavior changes
- [ ] Test structure uses root `describe`, per-method `describe`, and nested positive or negative cases
- [ ] `npm run format:md` was run when Markdown files changed
- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run test:run` exits 0
- [ ] `npm run test:coverage` exits 0 and coverage remains at or above 80%
- [ ] `npm build` passes if a build script exists
- [ ] `README.md` was reviewed and updated when the change was important, or explicitly confirmed unnecessary
- [ ] `version` in `package.json` was bumped according to Semantic Versioning
- [ ] No rules, tests, or coverage thresholds were weakened to make the task pass

## Quick reference - key file locations

```text
.
|-- src/                  # main TypeScript source
|-- tests/                # Vitest test suite
|-- package.json          # scripts, dependencies, version
|-- tsconfig.json         # TypeScript compiler config
|-- vitest.config.ts      # test and coverage config
|-- eslint.config.mjs     # ESLint entry point
|-- .eslint/              # shared ESLint fragments
`-- README.md             # project documentation
```

This skill applies exclusively to this repository.
