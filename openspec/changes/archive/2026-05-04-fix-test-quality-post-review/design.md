## Context

The grammy-testing migration (UABOT-240) replaced the custom `src/testing/` infrastructure with
`@grammyjs/testing` v0.17.0. A post-migration code review identified five classes of test-quality
issues. All are confined to test files — no production code or library changes are involved.

The issues fall into two categories:

1. **Spec violations** — patterns the grammy-testing-integration spec explicitly prohibits
   (`respondNext` as a membership substitute; manual per-collection clears instead of
   `chats.clear()`).
2. **Style inconsistencies** — redundant assertions and a `.requests` array access that should
   use the direct `.length` getter.

## Goals / Non-Goals

**Goals:**

- Bring every spec file into full conformance with the grammy-testing-integration spec.
- Eliminate the triple-clear `beforeEach` pattern in favour of `chats.clear()`.
- Standardise outgoing-count assertions to `expect(chats.outgoing).toHaveLength(n)`.
- Remove assertions that repeat information already encoded in typed `getAll<>()` parameters.
- Make `admin-check-notify.spec.ts` order-independent by resetting all mutated state in `beforeEach`.

**Non-Goals:**

- Changes to grammy-testing library source.
- Changes to production bot code.
- Additions to test coverage beyond what already exists.

## Decisions

### D1 — Dedicated `regularUser` actor over `respondNext` override

**Decision:** In `settings.command.spec.ts` and `role.command.spec.ts`, replace
`chats.outgoing.respondNext('getChatMember', { status: 'member' })` with a new
`regularUser = chats.newUser()` registered as `group.join(regularUser)`.

**Rationale:** The spec ("User role and membership is expressed via actor methods") prohibits
using API-response overrides as membership substitutes. The `user` variable in both files is
the group owner; tests that want non-admin behaviour must use a distinct actor. `group.join()`
is the correct pure-state setter for `member` status — no update is dispatched.

**Alternative considered:** Temporarily demote `user` via `group.join(user)` before the test and
restore with `group.own(user)` after. Rejected because it requires per-test state restoration
and couples the test to the actor's role in other tests.

### D2 — `chats.clear()` replaces the triple-clear pattern

**Decision:** Replace every `beforeEach` block that calls `chats.outgoing.clear()` +
`user.replies.clear()` + `chats.deletionsFor(chat).clear()` with a single `chats.clear()`.

**Rationale:** `chats.clear()` atomically resets outgoing requests, all reply inboxes, all
deletion logs, all edit logs, and the internal `messageIdToReply` registry. It was added in
grammy-testing v0.13.0 specifically to replace this pattern. Adoption was missed during the
UABOT-240 migration. Using it removes the risk of forgetting to clear a newly added log type.

**Note:** `chats.clear()` does NOT reset app-level session/state objects (`chatSession`,
`session`, `state`). Tests that mutate those still need explicit per-field resets in
`beforeEach` (see D5).

### D3 — Remove redundant `?.method` assertions in `no-channel-messages.composer.spec.ts`

**Decision:** Replace the `getAll<>()` + per-slot `?.method` assertion pattern with
`getMethods()` + `buildMethods()`, matching the pattern already used in `denylist` and
`no-russian` specs.

**Rationale:** The typed generics in `getAll<'deleteMessage', 'getChat', ...>()` already
encode the expected method at each position. The subsequent `expect(req?.method).toEqual('deleteMessage')` assertions add no information and fail noisily only when the sequence
is already broken. One `expect(getMethods()).toEqual(buildMethods([...]))` is sufficient and
is consistent with the rest of the codebase. Individual `getAll<>()` unpacking is reserved
for tests that actually inspect payload fields.

### D4 — Standardise `toHaveLength` on `chats.outgoing` directly

**Decision:** In `bot.spec.ts`, change `expect(chats.outgoing.requests).toHaveLength(n)` to
`expect(chats.outgoing).toHaveLength(n)`.

**Rationale:** `chats.outgoing` has a `.length` getter; vitest's `toHaveLength` matcher uses
it directly. Accessing `.requests` unnecessarily exposes the internal array and is inconsistent
with all other spec files.

### D5 — Explicit app-state resets in `admin-check-notify.spec.ts`

**Decision:** Add `state.isDeleted = false` and `chatSession.chatSettings.enableAdminCheck = false`
to the `beforeEach` block, alongside the `chats.clear()` from D2.

**Rationale:** Test 3 sets `state.isDeleted = true`; tests 1 and 2 each set `enableAdminCheck`
to different values. None are reset between tests. The current test order happens to be safe,
but any reordering or new test addition would produce false passes or failures. Explicit resets
make the suite order-independent.

`false` is chosen as the default for `enableAdminCheck` because it is the less-privileged state
— tests that require it enabled opt in explicitly per test.

## Risks / Trade-offs

- **Scope creep** — the triple-clear replacement touches many files. Risk of merge conflicts
  if other branches modify the same `beforeEach` blocks. Mitigation: land this change promptly
  while UABOT-240 is the only active test-touching branch.
- **`chats.clear()` clears more than the old pattern** — it also clears `editsFor` and
  `actionsFor` logs, which the old three-call pattern did not. Any test that reads those logs
  across multiple `beforeEach` cycles would break. Current tests do not do this, so the risk
  is theoretical.
