# TypeScript Feature Skill - UA Anti Spam Bot

This skill provides comprehensive guidance for implementing and maintaining TypeScript features in the **UA Anti Spam Bot** project.

## 📖 Documentation Structure

### 1. **QUICK_START.md** ⚡ (Start Here)
   - 5-minute overview of the feature development process
   - Two main patterns: text features vs. image features
   - File checklist and quick recipe
   - **Best for**: Getting oriented quickly

### 2. **ADDING_FEATURES.md** 📚 (Complete Reference)
   - Deep dive into architecture and design patterns
   - Step-by-step implementation guide
   - Testing strategy and coverage requirements
   - Code style conventions and best practices
   - Real code examples from the codebase
   - **Best for**: Implementing actual features

### 3. **SKILL.md** ✅ (Quality Gate)
   - The main TypeScript feature workflow checklist
   - Project context and conventions
   - Step-by-step quality gate process
   - **Best for**: Ensuring code quality and completeness

## 🚀 Quick Navigation

| Need | Read |
|------|------|
| **Get started in 5 min** | QUICK_START.md |
| **Implement a feature** | ADDING_FEATURES.md (step-by-step section) |
| **Understand patterns** | ADDING_FEATURES.md (feature types section) |
| **See examples** | ADDING_FEATURES.md (references section) |
| **Learn testing** | ADDING_FEATURES.md (testing strategy section) |
| **Quality checklist** | SKILL.md (self-review section) |

## 🎯 Two Main Feature Types

### 1️⃣ Text Message Features (Composers)
Process text content in messages:
- Detection → Service layer
- Handling → Composer layer  
- Types: Delete or Warn
- Examples: antisemitism detection, profanity filter

### 2️⃣ Image/Photo Features (Composers)
Process images, videos, stickers:
- ML models → TensorFlow services
- Processing → Composer layer
- Example: NSFW content detection

## 📋 Feature Implementation Checklist

```
□ Design the feature (text or image based)
□ Create service + tests (detection logic)
□ Create composer + registration (handling)
□ Wire dependencies in bot.ts
□ Add message templates
□ Update settings types
□ Write e2e tests
□ Verify 80% test coverage
□ TypeScript strict mode passes
□ Linting passes
□ Update README if needed
```

## 🏗️ Project Architecture

### Three Services
- **Bot** (`src/bot/`) - Grammy Telegram bot with composers
- **Server** (`src/server/`) - Express REST API for ML
- **Userbot** (`src/userbot/`) - MTProto research tool

### Key Directories
- `src/bot/composers/` - Feature implementations (core)
- `src/services/` - Business logic (detection/analysis)
- `src/bot/middleware/` - Request parsing
- `src/bot/messages/` - Message templates
- `tests/` - Test suite (80% coverage required)

## 🔑 Key Concepts

### Composers
- Grammy middleware bundles organizing features
- Process updates in a pipeline
- Two types: message (text) and photo (images)
- Dependency-injected services for testability

### Settings
- **Default** (`disableXxx`) - Feature on by default, can disable
- **Optional** (`enableXxx`) - Feature off by default, can enable
- Examples: disable NSFW filter, enable delete Russian

### Logging
- All violations logged to central logs chat
- Each feature has its own thread ID
- Important for moderation and monitoring

### Testing
- Service tests (detection logic)
- e2e tests (full flow)
- 80% minimum coverage enforced
- Run: `npm run test:coverage`

## 💡 Example Patterns

### Delete Pattern (Text)
```typescript
Check enabled → Detect violation → Log to chat → Delete message → Notify user
```
Example: `no-antisemitism.composer.ts`

### Warn Pattern (Text)
```typescript
Check enabled → Detect violation → Log to chat → Send warning reply
```
Example: `warn-obscene.composer.ts`

### ML Pattern (Image)
```typescript
Extract frames → Run ML model → Log result → Delete if needed
```
Example: `nsfw-filter.composer.ts`

## 📚 Learning Path

1. **Day 1**: Read QUICK_START.md (5 min)
2. **Day 1**: Review existing composer examples (30 min)
3. **Day 2**: Implement your feature following step-by-step guide (1-2 hours)
4. **Day 2**: Write tests and verify coverage (30 min)
5. **Day 3**: Review SKILL.md checklist and quality gate (30 min)

## 🔍 Key Files to Study

### Templates/Patterns
- `src/bot/composers/messages/no-antisemitism.composer.ts` - Delete pattern (text)
- `src/bot/composers/messages/warn-obscene.composer.ts` - Warn pattern (text)
- `src/bot/composers/messages/nsfw-filter.composer.ts` - ML pattern (image)

### Services
- `src/services/antisemitism.service.ts` - Simple pattern
- `src/services/obscene.service.ts` - Dictionary-based
- `src/services/swindlers-detect.service.ts` - Complex pattern

### Tests
- `tests/services/antisemitism.service.spec.ts` - Service test example
- `tests/bot.spec.ts` - e2e test example

### Hub Files
- `src/bot/composers/messages.composer.ts` - Text feature registration
- `src/bot/composers/photos.composer.ts` - Image feature registration

## ✅ Quality Requirements

- **TypeScript**: Strict mode, no `any`
- **Testing**: 80% minimum coverage (lines, functions, branches, statements)
- **Types**: Explicit return types, discriminated unions
- **Documentation**: JSDoc on public APIs
- **Naming**: Kebab-case files, camelCase exports, PascalCase classes

## 🛠️ Commands Reference

```bash
# Run tests
npm run test:run

# Check coverage (must be ≥80%)
npm run test:coverage

# Type check
npm run typecheck

# Lint (with auto-fix)
npm run lint:fix

# Format markdown
npm run format:md

# Start bot for testing
npm run start:bot

# Start server for testing
npm run start:server
```

## 🚨 Common Mistakes to Avoid

- ❌ Hardcoding service instances (use dependency injection)
- ❌ Deleting messages without logging violations
- ❌ Not testing edge cases (positive + negative)
- ❌ Using `any` in TypeScript
- ❌ Forgetting to register composer in parent
- ❌ Not updating settings types
- ❌ Skipping test coverage requirements

## 📞 Getting Help

1. **Quick question?** → Read QUICK_START.md
2. **Implementation help?** → See step-by-step in ADDING_FEATURES.md
3. **Pattern question?** → Check Feature Type Patterns section
4. **Example needed?** → Find reference files listed above
5. **Quality issues?** → Review SKILL.md checklist

## 📝 Version Info

- **Project**: UA Anti Spam Bot
- **Framework**: Grammy (Telegram)
- **Language**: TypeScript (strict)
- **Runtime**: Node.js 20+
- **Testing**: Vitest with 80% coverage

## 🔗 External Resources

- Grammy Docs: https://grammy.dev
- TypeScript Handbook: https://www.typescriptlang.org/docs
- Telegram Bot API: https://core.telegram.org/bots/api
- Vitest Guide: https://vitest.dev

---

**Last Updated**: March 2026
**Skill Version**: 1.2.0
