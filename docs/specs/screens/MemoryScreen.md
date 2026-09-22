---
name: MemoryScreen
type: screen
source: src/screens/MemoryScreen.tsx
status: draft
last_verified: 2026-09-22
---

# MemoryScreen

## Purpose

A deliberate placeholder for the second game, Family Memory (a photo
pair-matching game). It exists so the route behind the second tile on
`GameSelectScreen` is real and navigable — a tile that opened nothing
would read as a broken app — while the game itself is built out under
`src/games/memory/`.

## How it works

Stateless and, apart from navigation, inert: an `AppHeader` titled
"Family Memory" with a back chevron wired to `onBack`, over a centred
"Family Memory" heading on the cream page background. There is no game
logic, no photo access, and no persisted state yet.

`App.tsx` and `DemoApp.tsx` both route `onBack` to the game picker.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `onBack` | `() => void` | no | Back to the game picker. Absent → the header renders no back button at all. |

## Toddler UX constraints

- The only interactive element is the header's back button (48x48).
- Nothing here can be got wrong: there is no input to mis-tap.
- The screen is not a dead end for an adult — the back button is always
  present when a destination was supplied.

## Edge cases & expected behavior

- `onBack` omitted → no back button renders (rather than a dead one).
- The text "Family Memory" appears on screen, in both the header and the
  body.
- Nothing is persisted, so leaving and re-entering shows the same thing.

## Test scenarios

1. From the game picker, tap "Family Memory" → a screen headed "Family
   Memory" appears, showing the game's name and nothing else.
2. Tap Back → the game picker.

## Non-goals / known limitations

- **The game itself is not implemented.** No cards, no matching, no
  difficulty, no completion tracking. When it is built, it belongs in
  `src/games/memory/` (per the self-contained-plugin convention), with this
  screen reduced to its host.
- No background music hook of its own; `App.tsx` treats it as part of the
  child session, so the shared track keeps playing.

## Related

- Code: `src/screens/MemoryScreen.tsx`
- Tests: `src/screens/MemoryScreen.test.tsx`
- Related specs: [[GameSelectScreen]], [[AppHeader]]
