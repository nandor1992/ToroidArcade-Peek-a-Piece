---
name: LegalDocumentView
type: component
source: src/components/LegalDocumentView.tsx
status: draft
last_verified: 2026-09-22
---

# LegalDocumentView

## Purpose

Shows one bundled legal document — the privacy policy, terms of use, or
copyright notice — as readable, scrollable text inside the About sheet.

The documents are bundled rather than linked because the app makes no network
requests at all. A parent deciding whether to trust this app with photos of
their children should be able to read exactly what it promises without an
internet connection, and without leaving the app for a browser. That is the
whole reason this component exists instead of a `Linking.openURL` call.

## How it works

Stateless. It takes a [[legalDocuments]] `LegalDocument` and renders it:

1. The document title, the effective date, and a rule.
2. A `ScrollView` over `document.blocks`. Each block renders its optional
   `heading`, then each paragraph in `text`, then each entry in `bullets` as a
   `•` and a flex-1 `Text` so long bullets wrap under themselves rather than
   beside the mark.
3. A footer block with the contact address and the URL of the full-length
   version.
4. A rule and a **Back to About** button, which calls `onBack`.

The `ScrollView` is `flexGrow: 0, flexShrink: 1` inside a `maxHeight: '100%'`
container, so the document scrolls within the sheet rather than pushing the
Back button off the bottom of the screen.

`persistentScrollbar` is set deliberately: the scrollbar is the only cue that
there is more text below, and a parent should never believe they have read a
whole policy when they have seen a third of it.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `document` | `LegalDocument` | yes | The document to render — from `LEGAL_DOCUMENTS`. |
| `onBack` | `() => void` | yes | Fired by the Back to About button. |

## Toddler UX constraints

This component is **behind the parent gate** and is the one surface in the app
aimed squarely at an adult, so the usual toddler rules are relaxed: it is
dense text, and it depends entirely on reading.

What still holds:

- The Back to About button is a full-size target (12/32 padding, 24 radius),
  matching every other primary button in the app.
- Nothing here is destructive, so a stray tap by a child who got past the gate
  can do no harm — the worst case is landing on a wall of text.
- `accessibilityLabel` is **"Back to About"**, not "Back": the Settings screen
  header already owns "Back", and a screen-reader user hearing two identical
  labels has no way to tell which one leaves the document.

## Edge cases & expected behavior

- A block with no `heading` → renders its text with no heading, no gap
  artefact. Used for each document's opening summary.
- A block with `text` and `bullets` → paragraphs first, then bullets.
- A block with neither → renders an empty `View`; harmless, and no document
  currently has one.
- Two blocks with the same heading → keys stay unique (`heading ?? index`
  falls back to the index only for headingless blocks, and headings are
  distinct within each document).
- A document longer than the screen → scrolls internally; the title, rule and
  Back button stay put.
- It is **not** a Modal. The About sheet swaps its own contents for this view;
  stacking a second `Modal` on the first is what Android handles unreliably.

## Test scenarios

1. Open Settings → About → tap **Terms of Use** → the document title and its
   first heading are on screen, and the About dedication is not.
2. Tap **Back to About** → the dedication is back and the document heading is
   gone.
3. Open a document, go Back, Close, reopen About → lands on the About card,
   never mid-policy.
4. Each of the three entries in `LEGAL_DOCUMENTS` is reachable by its title.

## Non-goals / known limitations

- No markdown parsing, no rich text, no links. The blocks are plain strings;
  a URL in the footer is text to read, not a tappable link, because tapping
  out to a browser is exactly what the offline-first design avoids.
- No search, no per-section anchors. The documents are short enough to scroll.
- The in-app text is a tightened version of the canonical documents under
  `docs/legal/`. **The two are kept in sync by hand** — see [[legalDocuments]].

## Related

- Code: `src/components/LegalDocumentView.tsx`
- Content: `src/legal/legalDocuments.ts` — [[legalDocuments]]
- Tests: `src/screens/SettingsScreen.test.tsx` (covered through its host)
- Host: [[SettingsScreen]]
- Canonical documents: `docs/legal/privacy-policy.md`,
  `docs/legal/terms-of-service.md`, `docs/legal/copyright.md`
