---
name: <ComponentOrFeatureName>
type: component | screen | game | service | hook
source: src/path/to/File.tsx
status: draft
last_verified: YYYY-MM-DD
---

# <Name>

## Purpose

Why this exists — what it does for the parent or the toddler, one paragraph.
Prefer the "why" over the "what": the code already shows what it does.

## How it works

Plain-language walkthrough: key state, data flow, what happens on each user
interaction, in the order it happens. Enough for someone who has never read
the code to predict its behavior.

## Interface

Props / params in, callbacks / events out.

| Name | Type | Required | Notes |
|------|------|----------|-------|
|      |      |          |       |

## Toddler UX constraints

- Minimum touch target size and spacing
- Forgiving-input rules (e.g. mis-taps are silently ignored, not error-shown;
  no double-tap or precise-drag requirements)
- No reliance on reading text (icons/photos/color/sound instead)
- Audio/visual feedback expected on success and on invalid input

## Edge cases & expected behavior

- Condition → expected behavior
- Condition → expected behavior

This section is what the `spec-bug-hunter` agent diffs against the actual
code — be concrete and falsifiable, not aspirational.

## Test scenarios

1. Step-by-step user flow → expected result
2. ...

Written so each step translates directly into a Maestro flow step or an RNTL
assertion — this is what `e2e-tester` runs.

## Non-goals / known limitations

What this deliberately does not handle, and why (if non-obvious).

## Related

- Code: `src/...`
- Tests: `src/....test.tsx`
- E2E flow: `e2e/....yaml`
- Related specs: [[other-spec-name]]
