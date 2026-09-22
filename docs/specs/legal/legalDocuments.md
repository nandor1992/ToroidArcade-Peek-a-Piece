---
name: legalDocuments
type: service
source: src/legal/legalDocuments.ts
status: draft
last_verified: 2026-09-22
---

# legalDocuments

## Purpose

The text of the app's three legal documents — privacy policy, terms of use,
and copyright notice — as plain data, bundled into the binary.

Google Play requires a hosted privacy policy URL, and the canonical
full-length documents live under `docs/legal/` for exactly that. This module
is the *other* half: the same commitments, tightened for a phone screen, and
readable with no network connection. For an app whose entire pitch is that
photos of children never leave the device, "read our policy on the web" is the
wrong answer.

## How it works

Pure data, no behaviour. Three `LegalDocument` values are declared and exported
together as `LEGAL_DOCUMENTS`, in the order the About sheet shows them:
privacy, terms, copyright.

```
LegalDocument { id, label, title, blocks }
LegalBlock    { heading?, text?: string[], bullets?: string[] }
```

- `label` is the short chip text in the About sheet ("Privacy").
- `title` is the document heading, and doubles as the chip's
  `accessibilityLabel` ("Privacy Policy").
- `blocks` render in order; see [[LegalDocumentView]] for how.

Also exported:

- `COPYRIGHT_LINE` — the one-line notice shown on the About card itself.
- `LEGAL_CONTACT`, `LEGAL_EFFECTIVE_DATE` — placeholders, see below.
- `LEGAL_DOCS_URL` — where the full-length versions are published.

## Interface

| Name | Type | Notes |
|------|------|-------|
| `LEGAL_DOCUMENTS` | `LegalDocument[]` | The three documents, in display order. |
| `COPYRIGHT_LINE` | `string` | Shown under the version on the About card. |
| `LEGAL_CONTACT` | `string` | Contact address, in every document's footer. |
| `LEGAL_EFFECTIVE_DATE` | `string` | Shown under each document's title. |
| `LEGAL_DOCS_URL` | `string` | Canonical full-length documents. |

## Toddler UX constraints

None directly — this module renders nothing. Its consumer
([[LegalDocumentView]]) sits behind the parent gate and is the one adult-facing
surface in the app.

## Edge cases & expected behavior

- **Placeholders ship as placeholders.** `LEGAL_CONTACT` and
  `LEGAL_EFFECTIVE_DATE` are `PLACEHOLDER_CONTACT_EMAIL` and
  `PLACEHOLDER_DATE`, matching the same tokens in `docs/legal/*.md`. They must
  be filled in before the first Play release — the release checklist in
  `docs/PLAY-STORE.local.md` lists this as a blocker.
- **The in-app text and `docs/legal/` are kept in sync by hand.** There is no
  build step wiring them together, the same way `ABOUT_INFO.version` tracks
  `package.json` by hand. Change one, change the other.
- **`copyright.md` is an attribution notice, and a stale one is worse than
  none.** When a runtime dependency is added, removed, or swapped, update the
  open-source list here *and* in `docs/legal/copyright.md`.
- **Two licences, deliberately distinct.** The repo's `LICENSE` is MIT and
  covers the *source code*. The terms of use cover the *installed app*, and
  the starter pictures, music, and brand assets are carved out of the MIT
  grant entirely — the starter pictures are renders of real children's
  photographs. All three documents say so; keep them saying the same thing.
- Adding a fourth document: append it to `LEGAL_DOCUMENTS`. The About sheet
  renders the array, so nothing else needs to change — though the chip row
  wraps, and four chips will take two lines on a narrow phone.

## Test scenarios

1. Every entry in `LEGAL_DOCUMENTS` is reachable from the About sheet by its
   `title`, and renders its first heading.
2. `COPYRIGHT_LINE` appears on the About card.
3. Each document has at least one block with a heading (the spec above relies
   on it, and the `LegalDocumentView` tests assert it).

## Non-goals / known limitations

- Not localised. The app is English-only; when that changes, these documents
  are a translation job with legal weight, not a string-table swap.
- No versioning or "you must accept the new terms" flow. Material changes ship
  with a new app version and a new effective date, which is what the terms
  themselves say.
- The bundled text is a summary of the canonical documents. Where they differ,
  the hosted full-length version at `LEGAL_DOCS_URL` governs — which is why
  every document's footer points at it.

## Related

- Code: `src/legal/legalDocuments.ts`
- Renderer: [[LegalDocumentView]]
- Host: [[SettingsScreen]]
- Canonical documents: `docs/legal/privacy-policy.md`,
  `docs/legal/terms-of-service.md`, `docs/legal/copyright.md`
- Release checklist: `docs/PLAY-STORE.local.md` (gitignored)
- Code licence: `LICENSE` (MIT, with the asset carve-out)
