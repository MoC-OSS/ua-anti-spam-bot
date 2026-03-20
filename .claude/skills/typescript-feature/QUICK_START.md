# Quick Start: Adding Features to UA Anti Spam Bot

## 5-Minute Overview

This bot uses **Grammy** (Telegram framework) with **Composers** as the core pattern. Think of Composers as feature modules that process messages in a pipeline.

### Two Main Paths

#### 🔤 Text Message Feature (Delete or Warn)

```
Service (detect content) → Composer (handle deletion/warning) → Register in messages.composer
```

#### 📸 Image/Photo Feature (ML Analysis)

```
Tensor Service (ML model) → Composer (handle images) → Register in photos.composer
```

---

## Quick Recipe: Text Detection Feature

### 1. Create Service (`src/services/my-feature.service.ts`)

```typescript
export class MyFeatureService {
  checkFeature(message: string): SearchSetResult | null {
    // Your detection logic
    return result || null;
  }
}
export const myFeatureService = new MyFeatureService();
```

### 2. Create Tests (`tests/services/my-feature.service.spec.ts`)

```typescript
describe('MyFeatureService', () => {
  it('should detect bad content', () => {
    expect(myFeatureService.checkFeature('bad')).toBeTruthy();
  });
  it('should allow good content', () => {
    expect(myFeatureService.checkFeature('good')).toBeNull();
  });
});
```

### 3. Create Composer (`src/bot/composers/messages/my-feature.composer.ts`)

```typescript
export const getMyFeatureComposer = () => {
  const myFeatureComposer = new Composer<GrammyContext>();

  myFeatureComposer.use(async (context, next) => {
    const isEnabled = !context.chatSession.chatSettings.disableMyFeature;
    const violation = myFeatureService.checkFeature(context.state.text || '');

    if (isEnabled && violation) {
      await context.deleteMessage();
      await saveViolationLog(context, violation);
      await notifyUser(context, violation);
    }

    return next();
  });

  return { myFeatureComposer };
};
```

### 4. Register Composer (`src/bot/composers/messages.composer.ts`)

```typescript
// Add to interface
export interface MessagesComposerProperties {
  myFeatureComposer: Composer<GrammyContext>;
}

// Add to registration
export const getMessagesComposer = ({ myFeatureComposer }: ...) => {
  registerDefaultSettingModule('disableMyFeature', myFeatureComposer);
};
```

### 5. Wire Dependencies (`src/bot/bot.ts`)

```typescript
const { myFeatureComposer } = getMyFeatureComposer();
const { messagesComposer } = getMessagesComposer({
  myFeatureComposer,
  // ... other composers
});
```

### 6. Add Settings Type (`src/shared/types/session.ts`)

```typescript
interface DefaultChatSettings {
  disableMyFeature?: boolean; // Disable = feature is on by default
}
```

---

## File Checklist

- [ ] `src/services/my-feature.service.ts` - Detection logic
- [ ] `tests/services/my-feature.service.spec.ts` - Service tests
- [ ] `src/bot/composers/messages/my-feature.composer.ts` - Feature handler
- [ ] `src/bot/messages/my-feature.message.ts` - User notifications (optional)
- [ ] Update `src/bot/composers/messages.composer.ts` - Register composer
- [ ] Update `src/bot/bot.ts` - Wire dependencies
- [ ] Update `src/shared/types/session.ts` - Add settings type
- [ ] Update `tests/bot.spec.ts` - Add e2e tests (optional)

---

## Common Files to Reference

### Message Composers (Text Features)

- `src/bot/composers/messages/no-antisemitism.composer.ts` - **Delete pattern**
- `src/bot/composers/messages/warn-obscene.composer.ts` - **Warn pattern**
- `src/bot/composers/messages/swindlers.composer.ts` - **Complex detection**

### Image Composers (Media Features)

- `src/bot/composers/photos.composer.ts` - **Image registration hub**
- `src/bot/composers/messages/nsfw-filter.composer.ts` - **ML example**

### Services (Detection Logic)

- `src/services/antisemitism.service.ts` - **Simple pattern**
- `src/services/obscene.service.ts` - **Dictionary-based**
- `src/services/swindlers-detect.service.ts` - **Complex pattern**

### Tests

- `tests/services/antisemitism.service.spec.ts` - **Test structure**
- `tests/bot.spec.ts` - **e2e test patterns**

---

## Key Concepts

### Settings Types

- **`disableXxx`** = Feature is **ON by default**, can be disabled
  - Used for core spam filters (antisemitism, NSFW, swindlers)
- **`enableXxx`** = Feature is **OFF by default**, can be enabled
  - Used for optional filters (delete Russian, delete URLs)

### Context State

- `context.state.text` - Parsed message text
- `context.state.photo` - Parsed image data (file + metadata)
- `context.state.myResult` - Store your results here

### Logging

- Always log violations to logs chat using `context.api.sendMessage(logsChat, ...)`
- Use appropriate thread ID: `LOGS_CHAT_THREAD_IDS.YOUR_FEATURE`

---

## Testing Commands

```bash
# Run all tests
npm run test:run

# Run with coverage (needs ≥80%)
npm run test:coverage

# Type check
npm run typecheck

# Lint (with auto-fix)
npm run lint:fix
```

---

## Common Patterns

### Check if Feature Enabled

```typescript
const isEnabled = !context.chatSession.chatSettings.disableMyFeature;
if (isEnabled && violation) {
  /* ... */
}
```

### Save Violation Log

```typescript
await context.api.sendMessage(logsChat, message, {
  parse_mode: 'HTML',
  message_thread_id: LOGS_CHAT_THREAD_IDS.MY_FEATURE,
});
```

### Notify User (Self-Destructing Message)

```typescript
await context.replyWithSelfDestructedHTML(userMessage, {
  reply_to_message_id: context.msg?.message_id,
});
```

### Use Dataset for Dictionary Matching

```typescript
const tokens = searchSet.tokenize(message);
const result = dataset.my_dictionary.search(tokens);
```

---

## Tips

1. **Always look at existing features first** - The codebase has great examples
2. **Test early and often** - Run `npm run test:coverage` after each step
3. **Keep services focused** - Service = detection logic only
4. **Keep composers thin** - Composer = orchestration only (call service, log, notify)
5. **Log everything** - Always save violations to logs chat for moderation
6. **Type everything** - Maintain TypeScript strict mode
7. **Document public APIs** - Add JSDoc to exported functions

---

## Need Help?

1. Read `ADDING_FEATURES.md` for the complete guide
2. Study reference implementations in `src/bot/composers/messages/`
3. Check test examples in `tests/services/`
4. Review the Grammy docs: https://grammy.dev
