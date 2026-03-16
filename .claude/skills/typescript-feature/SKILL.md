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
| ------------------- | ------------------------------------------------------ |
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

## Feature Development Guide - Architecture & Patterns

This project is a **Grammy-based Telegram bot** with a Composer pattern for organizing features. Understand this before implementing.

### Architecture Overview

Three main services:
- **Bot** (`src/bot/`) - Grammy Telegram bot with feature composers
- **Server** (`src/server/`) - Express REST API for ML inference
- **Userbot** (`src/userbot/`) - MTProto userbot for research

### Two Feature Types & Patterns

#### 1️⃣ Text Message Features (Composers)

**Pattern:** Service (detect) → Composer (handle) → Register

```typescript
// Service: src/services/my-feature.service.ts
export class MyFeatureService {
  checkFeature(message: string): SearchSetResult | null {
    // Detection logic
    return result || null;
  }
}
export const myFeatureService = new MyFeatureService();

// Composer: src/bot/composers/messages/my-feature.composer.ts
export const getMyFeatureComposer = () => {
  const myFeatureComposer = new Composer<GrammyContext>();
  
  myFeatureComposer.use(async (context, next) => {
    const isEnabled = !context.chatSession.chatSettings.disableMyFeature;
    const violation = myFeatureService.checkFeature(context.state.text || '');
    
    if (isEnabled && violation) {
      await context.deleteMessage();  // or warning
      await saveViolationLog(context, violation);
      await notifyUser(context);
    }
    return next();
  });
  
  return { myFeatureComposer };
};

// Registration: src/bot/composers/messages.composer.ts
export interface MessagesComposerProperties {
  myFeatureComposer: Composer<GrammyContext>;
}
export const getMessagesComposer = ({ myFeatureComposer }: ...) => {
  registerDefaultSettingModule('disableMyFeature', myFeatureComposer);
};
```

**Settings Types:**
- **`disableXxx`** = Feature ON by default (core spam filters)
- **`enableXxx`** = Feature OFF by default (optional filters)

**Real Examples:**
- Delete: `src/bot/composers/messages/no-antisemitism.composer.ts`
- Warn: `src/bot/composers/messages/warn-obscene.composer.ts`

#### 2️⃣ Image/Photo Features (Composers)

**Pattern:** ML Service (analyze) → Composer (handle) → Register

```typescript
// Service: src/services/my-tensor.service.ts
export class MyTensorService {
  async analyze(imageBuffer: Buffer): Promise<Result> {
    // ML model prediction
  }
}

// Composer: src/bot/composers/my-image.composer.ts
export const getMyImageComposer = ({ myTensorService }: Props) => {
  const myImageComposer = new Composer<GrammyContext>();
  
  myImageComposer.use(async (context, next) => {
    const imageData = context.state.photo;
    if (!imageData) return next();
    
    try {
      const result = await myTensorService.analyze(imageData.file);
      if (result.isProblematic) {
        await context.deleteMessage();
        // Log and notify
      }
    } catch (error) {
      handleError(error);
    }
    return next();
  });
  
  return { myImageComposer };
};
```

**Real Example:**
- `src/bot/composers/messages/nsfw-filter.composer.ts`

### Implementation Checklist

For text features:
- [ ] Service created: `src/services/my-feature.service.ts`
- [ ] Service tests: `tests/services/my-feature.service.spec.ts`
- [ ] Composer created: `src/bot/composers/messages/my-feature.composer.ts`
- [ ] Composer registered in `src/bot/composers/messages.composer.ts`
- [ ] Dependencies wired in `src/bot/bot.ts`
- [ ] Message templates: `src/bot/messages/my-feature.message.ts`
- [ ] Settings type added: `src/shared/types/session.ts`
- [ ] e2e tests added: `tests/bot.spec.ts`
- [ ] 80% test coverage verified: `npm run test:coverage`
- [ ] All checks pass: `npm run typecheck && npm run lint && npm run test:run`

### Key Patterns to Follow

**Always:**
- ✅ Log violations to logs chat: `context.api.sendMessage(logsChat, ...)`
- ✅ Notify users when deleting: `context.replyWithSelfDestructedHTML(...)`
- ✅ Use dependency injection for services
- ✅ Keep services focused on detection only
- ✅ Keep composers focused on orchestration only

**Never:**
- ❌ Hardcode service instances (pass as dependency)
- ❌ Delete messages without logging
- ❌ Use `any` type in TypeScript
- ❌ Skip test coverage requirements (80% minimum)
- ❌ Forget to register composers in parent
- ❌ Delete without user notification

### Code Style Requirements

| Item | Standard |
|------|----------|
| Files | kebab-case.ts |
| Classes | PascalCase |
| Exports | camelCase |
| Variables | camelCase |
| Constants | UPPER_SNAKE_CASE |
| TypeScript | Strict mode, no `any` |
| Testing | 80% coverage minimum |
| Documentation | JSDoc on public APIs |

### Testing Standards

Service tests (`tests/services/my-feature.service.spec.ts`):
```typescript
describe('MyFeatureService', () => {
  it('should detect problematic content', () => {
    expect(myFeatureService.checkFeature('bad')).toBeTruthy();
  });
  it('should allow normal content', () => {
    expect(myFeatureService.checkFeature('good')).toBeNull();
  });
});
```

e2e tests (`tests/bot.spec.ts`):
```typescript
it('should delete and notify on violation', async () => {
  const mockMessage = new MessageMockUpdate({ text: 'violating content' });
  await bot.handleUpdate(mockMessage.update);
  
  expect(outgoingRequests.deleteMessage).toHaveBeenCalled();
  expect(outgoingRequests.sendMessage).toHaveBeenCalledWith(
    expect.any(Number),
    expect.stringContaining('Your message was removed'),
    expect.any(Object)
  );
});
```

### Reference Files in Codebase

To understand patterns, study:
- **Text deletion:** `src/bot/composers/messages/no-antisemitism.composer.ts`
- **Text warning:** `src/bot/composers/messages/warn-obscene.composer.ts`
- **Image/ML:** `src/bot/composers/messages/nsfw-filter.composer.ts`
- **Simple service:** `src/services/antisemitism.service.ts`
- **Complex service:** `src/services/swindlers-detect.service.ts`
- **Registration hub:** `src/bot/composers/messages.composer.ts`
- **Photo hub:** `src/bot/composers/photos.composer.ts`
- **Test example:** `tests/services/antisemitism.service.spec.ts`

## Quick reference - key file locations

```text
.
|-- src/
|   |-- bot/
|   |   |-- composers/                    # Feature implementations (core pattern)
|   |   |   |-- messages/                 # Text message features
|   |   |   |-- photos.composer.ts        # Photo/image features
|   |   |   └-- messages.composer.ts      # Registration hub for text
|   |   |-- middleware/                   # Request parsing and state
|   |   |-- messages/                     # Message templates
|   |   └-- bot.ts                        # Dependency injection wiring
|   |-- services/                         # Business logic (detection/analysis)
|   |-- shared/                           # Types, config, utils
|   └-- tensor/                           # ML models
|-- tests/                                # Vitest test suite (80% coverage required)
|-- package.json                          # scripts, dependencies
|-- tsconfig.json                         # TypeScript compiler config
|-- vitest.config.ts                      # Test and coverage config
|-- eslint.config.mjs                     # ESLint config
`-- README.md                             # Project documentation
```

## When You Need More Information

**If you get stuck or need more detail**, read these supplementary files from `.claude/skills/typescript-feature/`:

1. **Need a quick 5-minute overview?**
   → Read `QUICK_START.md`

2. **Need step-by-step detailed implementation guide?**
   → Read `ADDING_FEATURES.md` (covers all steps, testing, style, conventions in detail)

3. **Need architecture overview and navigation?**
   → Read `README.md`

**How to read them**: If at any point during feature implementation you need more information about patterns, testing, or code style, explicitly use the `view` tool to read the appropriate supplementary file.

### When to Read Each File

| Situation | Read |
|-----------|------|
| "What's the basic pattern?" | SKILL.md (this file) |
| "How do I implement feature X?" | SKILL.md steps + ADDING_FEATURES.md |
| "What's the exact code structure?" | Code templates in SKILL.md |
| "I need to understand testing better" | ADDING_FEATURES.md Testing Strategy section |
| "Show me code examples" | ADDING_FEATURES.md Feature Type Patterns section |
| "I'm stuck on naming/style" | SKILL.md Code Style Requirements + ADDING_FEATURES.md |
| "How do composers work?" | SKILL.md + ADDING_FEATURES.md Architecture section |

This skill applies exclusively to this repository.
