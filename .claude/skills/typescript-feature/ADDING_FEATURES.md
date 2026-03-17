# How to Add New Features to UA Anti Spam Bot

This guide explains the architecture and process for adding new features to the UA Anti Spam Bot. The bot uses **Grammy** (a Telegram bot framework) with **Composers** as the core pattern for organizing feature logic.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Understanding Composers](#understanding-composers)
3. [Feature Types and Patterns](#feature-types-and-patterns)
4. [Step-by-Step Guide](#step-by-step-guide)
5. [Testing Strategy](#testing-strategy)
6. [Code Style & Conventions](#code-style--conventions)

---

## Architecture Overview

### Three Main Services

The project has three primary services:

1. **Bot Service** (`src/bot/`) - Grammy Telegram bot with composers for message processing
2. **Server Service** (`src/server/`) - Express.js REST API for ML inference
3. **Userbot Service** (`src/userbot/`) - MTProto userbot for research purposes

### Key Directories

```
src/
├── bot/
│   ├── composers/          # Feature implementations (core pattern)
│   │   ├── messages/       # Text message features
│   │   ├── photos.composer.ts      # Photo/image features
│   │   └── ...
│   ├── middleware/         # Request parsing and state management
│   ├── filters/            # Boolean guards
│   └── messages/           # Message templates
├── services/               # Shared business logic
├── tensor/                 # ML models (NSFW, spam detection)
└── shared/                 # Types, config, utilities
```

---

## Understanding Composers

### What is a Composer?

A **Composer** is a Grammy construct that bundles related middleware and handlers. It processes updates (messages, photos, commands) in a pipeline.

```typescript
// Example: Simple composer structure
export const getMyFeatureComposer = () => {
  const myComposer = new Composer<GrammyContext>();

  myComposer.use(async (context, next) => {
    // Your logic here
    await next();
  });

  return { myComposer };
};
```

### Two Composer Types in This Project

#### 1. **Message Composers** (Text-Based Features)

These handle text message content. Examples:
- `no-antisemitism.composer.ts` - Detects and deletes antisemitic messages
- `no-obscene.composer.ts` - Detects and deletes obscene language
- `warn-obscene.composer.ts` - Warns instead of deleting
- `swindlers.composer.ts` - Detects scam-related messages

**Key characteristics:**
- Operate on `context.state.text` (parsed message text)
- Check feature settings from `context.chatSession.chatSettings`
- Call services to perform detection/analysis
- Log violations to logs chat
- Send user notifications or delete messages

#### 2. **Image/Photo Composers** (Media-Based Features)

These handle images, videos, photos, stickers. Examples:
- `nsfw-filter.composer.ts` - Detects and removes NSFW images using TensorFlow

**Key characteristics:**
- Operate on `context.state.photo` (parsed image data)
- May use TensorFlow models or external APIs
- Process extracted video frames or photo previews
- Handle multiple media types (photos, videos, stickers, animations)

---

## Feature Types and Patterns

### Pattern 1: Text Message Detection (Delete)

Used for detecting and **deleting** harmful text content.

**Service Layer** (`src/services/`):
```typescript
// Example: antisemitism.service.ts
export class AntisemitismService {
  checkAntisemitism(message: string): SearchSetResult | null {
    // Detection logic using dataset or algorithms
    return searchResult || null;
  }
}

export const antisemitismService = new AntisemitismService();
```

**Composer Layer** (`src/bot/composers/messages/`):
```typescript
export const getNoAntisemitismComposer = () => {
  const noAntisemitismComposer = new Composer<GrammyContext>();

  async function saveViolationMessage(context: GrammyContext, result: SearchSetResult) {
    // Log to logs chat with details
    await context.api.sendMessage(logsChat, message, { 
      parse_mode: 'HTML',
      message_thread_id: LOGS_CHAT_THREAD_IDS.ANTISEMITISM, 
    });
  }

  noAntisemitismComposer.use(async (context, next) => {
    const isEnabled = !context.chatSession.chatSettings.disableDeleteAntisemitism;
    const violation = antisemitismService.checkAntisemitism(context.state.text || '');

    if (isEnabled && violation) {
      await context.deleteMessage();
      await saveViolationMessage(context, violation);

      // Send user notification
      await context.replyWithSelfDestructedHTML(
        getDeleteAntisemitismMessage(context, { word: violation.origin })
      );
    }

    return next();
  });

  return { noAntisemitismComposer };
};
```

**Test** (`tests/services/`):
```typescript
describe('AntisemitismService', () => {
  it('should detect harmful content', () => {
    const result = antisemitismService.checkAntisemitism('harmful text');
    expect(result).toBeTruthy();
  });

  it('should not flag regular messages', () => {
    const result = antisemitismService.checkAntisemitism('normal text');
    expect(result).toBeNull();
  });
});
```

### Pattern 2: Text Message Warning (Warn, Not Delete)

Used for **warning** users about content instead of deleting.

**Differences from Pattern 1:**
- Doesn't delete the message
- Sends a warning reply
- Typically for less severe violations

Example: `warn-obscene.composer.ts`
```typescript
export const getWarnObsceneComposer = () => {
  const warnObsceneComposer = new Composer<GrammyContext>();

  warnObsceneComposer.use(async (context, next) => {
    const isEnabled = context.chatSession.chatSettings.enableWarnObscene;
    const violation = obsceneService.checkObscene(context.state.text || '');

    if (isEnabled && violation) {
      // Don't delete, just warn
      await context.replyWithSelfDestructedHTML(
        getWarnObsceneMessage(context),
        { reply_to_message_id: context.msg?.message_id }
      );
    }

    return next();
  });

  return { warnObsceneComposer };
};
```

### Pattern 3: Image/Photo Detection

Used for **image/video analysis** with ML models or external APIs.

Example: `nsfw-filter.composer.ts`
```typescript
export interface NsfwFilterComposerProperties {
  nsfwTensorService: NsfwTensorService; // Injected dependency
}

export const getNsfwFilterComposer = ({ nsfwTensorService }: NsfwFilterComposerProperties) => {
  const nsfwFilterComposer = new Composer<GrammyContext>();

  nsfwFilterComposer.use(async (context, next) => {
    const imageData = context.state.photo;
    if (!imageData) return next();

    const imageBuffers = /* extract frames/preview */;

    try {
      const result = await nsfwTensorService.predictVideo(imageBuffers);
      context.state.nsfwResult = { tensor: result };

      if (result.isSpam) {
        await context.deleteMessage();
        // Log and notify user
      }
    } catch (error) {
      handleError(error);
    }

    return next();
  });

  return { nsfwFilterComposer };
};
```

**Key points for image composers:**
- Extract image data from `context.state.photo`
- Handle multiple formats: photos, videos, stickers, animations, video notes
- Use ML models via `nsfwTensorService` or external APIs
- Store results in context state for downstream processing

---

## Step-by-Step Guide

### Step 1: Design Your Feature

1. **Decide the type:**
   - Is it text-based or image-based?
   - Should it delete, warn, or just log?
   - Does it need ML or algorithmic detection?

2. **Choose the composer location:**
   - Text features → `src/bot/composers/messages/`
   - Image features → `src/bot/composers/` (at root)

3. **Identify dependencies:**
   - Do you need a service? (`src/services/`)
   - Do you need a utility? (`src/shared/utils/`)
   - Do you need a message template? (`src/bot/messages/`)

4. **Decide on settings:**
   - **Default settings** (in `DefaultChatSettings`): Always-on features like spam/NSFW
   - **Optional settings** (in `OptionalChatSettings`): User-selectable features

### Step 2: Implement the Service (if needed)

If your feature requires detection logic, create a service:

**File:** `src/services/my-feature.service.ts`

```typescript
/**
 * @module my-feature.service
 * @description Brief description of what this service does
 */

import { dataset } from '@dataset/dataset';
import { SearchSet } from '@utils/search-set.util';

export class MyFeatureService {
  private searchSet = new SearchSet();

  /**
   * Detects if a message contains problematic content.
   * @param message The text to analyze
   * @returns Detection result or null
   */
  checkFeature(message: string): SearchSetResult | null {
    // Your detection logic
    const tokens = this.searchSet.tokenize(message);
    return dataset.my_dictionary.search(tokens) || null;
  }
}

export const myFeatureService = new MyFeatureService();
```

**Test:** `tests/services/my-feature.service.spec.ts`

```typescript
import { myFeatureService } from '@services/my-feature.service';

describe('MyFeatureService', () => {
  it('should detect problematic content', () => {
    const result = myFeatureService.checkFeature('bad content');
    expect(result).toBeTruthy();
  });

  it('should not flag normal content', () => {
    const result = myFeatureService.checkFeature('normal content');
    expect(result).toBeNull();
  });
});
```

### Step 3: Implement the Composer

**File:** `src/bot/composers/messages/my-feature.composer.ts` (for text)

```typescript
import { Composer } from 'grammy';
import escapeHTML from 'escape-html';

import { logsChat } from '@bot/creator';
import { LOGS_CHAT_THREAD_IDS } from '@const/logs.const';
import { myFeatureWarnMessage, getMyFeatureMessage } from '@message';
import { myFeatureService } from '@services/my-feature.service';
import type { GrammyContext } from '@app-types/context';
import type { SearchSetResult } from '@utils/search-set.util';
import { telegramUtility } from '@utils/util-instances.util';
import { getUserData } from '@utils/generic.util';

/**
 * @description Delete messages violating my feature policy
 */
export const getMyFeatureComposer = () => {
  const myFeatureComposer = new Composer<GrammyContext>();

  /**
   * Logs a violation to the logs chat for review.
   * @param context The Grammy context
   * @param searchResult Detection result from the service
   */
  async function saveViolationMessage(
    context: GrammyContext,
    searchResult: SearchSetResult
  ) {
    const { userMention, chatMention } = await telegramUtility.getLogsSaveMessageParts(context);
    const text = context.state?.text || '';

    return context.api.sendMessage(
      logsChat,
      `${myFeatureWarnMessage} due to "${searchResult.origin}" by user ${userMention}:\n\n${
        chatMention || userMention
      }\n${escapeHTML(text)}`,
      {
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.MY_FEATURE,
      }
    );
  }

  myFeatureComposer.use(async (context, next) => {
    // Check if feature is enabled in chat settings
    const isEnabled = !context.chatSession.chatSettings.disableMyFeature;
    const violation = myFeatureService.checkFeature(context.state.text || '');

    if (isEnabled && violation) {
      await context.deleteMessage();
      await saveViolationMessage(context, violation);

      // Notify user
      const { writeUsername, userId } = getUserData(context);
      await context.replyWithSelfDestructedHTML(
        getMyFeatureMessage(context, { writeUsername, userId })
      );
    }

    return next();
  });

  return { myFeatureComposer };
};
```

**For image composers** (`src/bot/composers/my-images.composer.ts`):

```typescript
export interface MyImageComposerProperties {
  myTensorService: MyTensorService; // Dependency injection
}

export const getMyImageComposer = ({ myTensorService }: MyImageComposerProperties) => {
  const myImageComposer = new Composer<GrammyContext>();

  myImageComposer.use(async (context, next) => {
    const imageData = context.state.photo;

    if (!imageData || !imageData.file) {
      return next();
    }

    try {
      const result = await myTensorService.analyze(imageData.file);
      context.state.myImageResult = result;

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

### Step 4: Register the Composer

Composers are registered in either:
- `src/bot/composers/messages.composer.ts` (for text features)
- `src/bot/composers/photos.composer.ts` (for image features)

**Example - Messages Composer:**

```typescript
// In getMessagesComposer function, add interface:
export interface MessagesComposerProperties {
  // ... existing properties
  myFeatureComposer: Composer<GrammyContext>;
}

// Then register it:
export const getMessagesComposer = ({
  // ... existing parameters
  myFeatureComposer,
}: MessagesComposerProperties) => {
  // ...
  
  // Register using default or optional setting
  registerDefaultSettingModule('disableMyFeature', myFeatureComposer);
  // OR
  registerOptionalSettingModule('enableMyFeature', myFeatureComposer);
};
```

### Step 5: Wire Up Dependencies

In `src/bot/bot.ts` (where composers are assembled):

```typescript
import { getMyFeatureComposer } from '@bot/composers/messages/my-feature.composer';
import { myFeatureService } from '@services/my-feature.service';

export const getBot = async (bot: Bot<GrammyContext>) => {
  // ... existing setup

  const { myFeatureComposer } = getMyFeatureComposer();
  
  // Pass to messages composer
  const { messagesComposer } = getMessagesComposer({
    // ... existing
    myFeatureComposer,
  });
};
```

### Step 6: Add Messages/Templates

Create message templates in `src/bot/messages/my-feature.message.ts`:

```typescript
import type { GrammyContext } from '@app-types/context';

export const myFeatureWarnMessage = 'Your message was flagged for...';

export function getMyFeatureMessage(
  context: GrammyContext,
  { writeUsername, userId }: { writeUsername: string; userId: number }
): string {
  return `❌ User <a href="tg://user?id=${userId}">${writeUsername}</a>, 
    your message was removed because...`;
}
```

### Step 7: Update Settings Types

Add your feature to chat settings in `src/shared/types/session.ts`:

```typescript
export interface DefaultChatSettings {
  // ... existing
  disableMyFeature?: boolean; // Default-enabled features use 'disable' prefix
}

export interface OptionalChatSettings {
  // ... existing
  enableMyFeature?: boolean; // Optional features use 'enable' prefix
}
```

---

## Testing Strategy

### Service Tests

Test the detection/analysis logic in isolation:

**File:** `tests/services/my-feature.service.spec.ts`

```typescript
import { myFeatureService } from '@services/my-feature.service';

describe('MyFeatureService', () => {
  describe('checkFeature', () => {
    describe('positive cases', () => {
      it('should detect content variant 1', () => {
        const result = myFeatureService.checkFeature('specific bad content');
        expect(result).toBeTruthy();
        expect(result?.origin).toBe('specific bad content');
      });

      it('should detect content variant 2', () => {
        const result = myFeatureService.checkFeature('another variant');
        expect(result).toBeTruthy();
      });
    });

    describe('negative cases', () => {
      it('should not flag normal content', () => {
        const result = myFeatureService.checkFeature('normal safe text');
        expect(result).toBeNull();
      });

      it('should not flag content with similar words', () => {
        const result = myFeatureService.checkFeature('content with word');
        expect(result).toBeNull();
      });
    });
  });
});
```

### Integration Tests (e2e)

Test the full flow in `tests/bot.spec.ts` using mock updates:

```typescript
it('should delete message and notify user when my feature detected', async () => {
  const mockMessage = new MessageMockUpdate({
    text: 'message with problematic content',
  });

  await bot.handleUpdate(mockMessage.update);

  // Assertions on outgoingRequests
  expect(outgoingRequests.deleteMessage).toHaveBeenCalledWith(
    expect.any(Number), // chat_id
    expect.any(Number)  // message_id
  );

  expect(outgoingRequests.sendMessage).toHaveBeenCalledWith(
    expect.any(Number),
    expect.stringContaining('Your message was removed'),
    expect.any(Object)
  );
});
```

### Coverage Requirements

Maintain **80% minimum coverage**:
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

Run: `npm run test:coverage`

---

## Code Style & Conventions

### Naming Conventions

| Element | Pattern | Example |
|---------|---------|---------|
| Service class | `PascalCase` | `AntisemitismService` |
| Service instance | `camelCase` | `antisemitismService` |
| Composer getter | `get<Name>Composer` | `getNoAntisemitismComposer` |
| Service file | `kebab-case.service.ts` | `antisemitism.service.ts` |
| Composer file | `kebab-case.composer.ts` | `no-antisemitism.composer.ts` |
| Test file | `*.spec.ts` | `antisemitism.service.spec.ts` |
| Setting key | `camelCase` | `disableMyFeature` |

### Documentation

Add JSDoc to:
- All exported functions
- Non-trivial internal functions
- Complex logic

```typescript
/**
 * @description Detects problematic content using pattern matching
 * @param {string} message - The text to analyze
 * @returns {SearchSetResult | null} Detection result or null if clean
 */
function checkContent(message: string): SearchSetResult | null {
  // ...
}
```

### Error Handling

Use the project's error handler:

```typescript
import { handleError } from '@utils/error-handler.util';

try {
  // ML or API call
} catch (error) {
  handleError(error, 'MY_FEATURE_ERROR');
  // Fallback behavior
}
```

### Type Safety

- Keep TypeScript strict (no `any`)
- Use discriminated unions for complex states
- Export explicit types for public APIs
- Use `unknown` for truly unknown values, then narrow safely

```typescript
// ✅ Good
interface MyFeatureResult {
  isProblematic: boolean;
  confidence: number;
  reason: string;
}

// ❌ Avoid
interface MyFeatureResult {
  any: any; // loses type safety
}
```

### Immutability

Prefer immutable updates:

```typescript
// ✅ Good
context.state = { ...context.state, myResult: result };

// ✅ Also good for state
context.state.myResult = result;
```

### Dependency Injection

Follow the pattern used in existing composers:

```typescript
// Service dependencies are passed as constructor parameters
export const getMyComposer = ({ myService }: ComposerProperties) => {
  // Avoid: const myService = new MyService();
  // Use passed dependency instead
};
```

---

## Checklist for New Features

- [ ] Service created (`src/services/my-feature.service.ts`)
- [ ] Service tests written (`tests/services/my-feature.service.spec.ts`)
- [ ] Composer created (`src/bot/composers/messages/my-feature.composer.ts`)
- [ ] Composer registered in appropriate parent composer
- [ ] Dependency injection wired in `src/bot/bot.ts`
- [ ] Settings type added to `src/shared/types/session.ts`
- [ ] Message templates created (`src/bot/messages/my-feature.message.ts`)
- [ ] JSDoc added to all public functions
- [ ] All tests pass: `npm run test:run`
- [ ] Coverage maintained ≥80%: `npm run test:coverage`
- [ ] TypeScript strict checks pass: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] e2e tests added in `tests/bot.spec.ts` (if applicable)
- [ ] README updated if new user-facing behavior

---

## Common Patterns & Anti-Patterns

### ✅ Good Patterns

1. **Filter early, process late**
   ```typescript
   // Skip processing before it starts
   if (!isFeatureEnabled || !violationFound) return next();
   ```

2. **Dependency injection**
   ```typescript
   // Composable and testable
   export const getComposer = ({ service }: Props) => { /* ... */ };
   ```

3. **Logging violations**
   ```typescript
   // Always save violations for moderation review
   await saveViolationMessage(context, result);
   ```

4. **User feedback**
   ```typescript
   // Notify users why their message was removed
   await context.replyWithSelfDestructedHTML(message);
   ```

### ❌ Anti-Patterns

1. **Silent deletion without logging**
   ```typescript
   // ❌ Never delete without recording
   await context.deleteMessage(); // No logging
   ```

2. **Hardcoded service instances**
   ```typescript
   // ❌ Not testable
   const service = new MyService();
   ```

3. **Blocking without settings**
   ```typescript
   // ❌ Force-enable features users might disable
   if (violation) await deleteMessage();
   ```

4. **No JSDoc for public APIs**
   ```typescript
   // ❌ Future developers won't know parameters
   export function check(input: unknown): boolean { /* ... */ }
   ```

---

## Learning Resources

1. **Grammy Documentation**: https://grammy.dev - Framework fundamentals
2. **Existing Composers**: Review `src/bot/composers/messages/*.ts` for patterns
3. **Services**: Check `src/services/*.ts` for business logic examples
4. **Tests**: Review `tests/services/*.spec.ts` for testing patterns

---

## Questions?

Review these reference implementations:
- Simple text detection: `no-obscene.composer.ts` + `obscene.service.ts`
- Complex detection: `swindlers-detect.service.ts` + `swindlers.composer.ts`
- Image analysis: `nsfw-filter.composer.ts` + `nsfw-tensor.service.ts`
- Warning pattern: `warn-obscene.composer.ts`
- Logging pattern: `getLogsSaveMessageParts()` in any composer
