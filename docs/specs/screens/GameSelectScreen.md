---
name: GameSelectScreen
type: screen
source: src/screens/GameSelectScreen.tsx
status: draft
last_verified: 2026-09-22
---

# GameSelectScreen

## Purpose

The app's landing screen. Peek-a-Piece is a collection of games built from
family photos, not a single jigsaw app, so the first thing on screen is the
choice of *which* game — one large tile per game. A toddler picks by
picture, not by reading; the adult handing over the tablet gets a label
under each glyph.

Before this screen existed the app opened straight onto the puzzle grid,
which left nowhere to put a second game.

## How it works

Stateless apart from tile measurement. A module-level `GAMES` array
describes each tile (key, title, [[GameMark]] name, accent colour); the
screen maps over it, looking each tile's press handler up from the props by
key. Adding a third game means adding a row to `GAMES`, a prop, an entry in
the handler map, and geometry in the mark generator — nothing else on this
screen is game-specific.

**Tiles are cream, not the game's colour.** Each tile carries its game's
colour only as a thick base stripe (`borderBottomWidth: 10`), over a
`colors.cream` face with a faint navy hairline and a soft shadow to lift it
off the page. That is forced by the marks: they are full-colour brand
artwork, so a teal jigsaw piece on a teal tile would disappear. The stripe
keeps teal/coral as the at-a-glance difference between the two.

**Layout.** `useWindowDimensions` drives two things. The tile container is
a row in landscape and a column in portrait (`height > width`), so the two
tiles always split the long axis. And its padding and gap are both set to
`INSET_RATIO` (10%) of the screen's *shorter* side — proportional rather
than fixed, so the breathing room reads the same on a phone and a tablet
instead of being a hairline on one and a canyon on the other. Tiles
`flex: 1` inside that with `alignItems: 'stretch'`, and a `minWidth` /
`minHeight` of 160; there is deliberately no `maxHeight`, so on a tablet
they grow to fill the screen rather than sitting as two small squares in a
sea of background.

**Mark sizing.** Skia needs a pixel size and the tiles are flex-sized, so
each tile measures itself with `onLayout` and sizes its mark to fill what
it measured: 94% of the tile's width, or its height minus `LABEL_SPACE`
(44, covering the label, its gap and the base stripe), whichever is
smaller, clamped at 0. The mark therefore renders on the second pass —
before that the tile is just its background. On a phone in portrait this
puts the mark around 290dp; on a tablet in landscape around 435dp.

Chrome: the same pre-blurred `home-bg.jpg` backdrop as `HomeScreen` (so
the two read as one app) under a `SafeAreaView`, with `AppHeader` at the
top showing the app name and **no** back button — this is the top of the
stack.

In the bottom-right corner sits the same "Parent controls" button
`HomeScreen` carries, at the same deliberately low contrast
(`opacity: 0.55` at rest) so it doesn't invite a toddler's tap. It's here
as well as on the game screens so a grown-up can reach Settings from the
app's first screen rather than having to enter a game first. Like
`HomeScreen`'s, it's omitted entirely when `onOpenParentArea` is absent,
rather than left as a dead button.

Because the parent area now has more than one way in, `App.tsx` records
the screen it was opened from and returns there when the gate is
cancelled or the parent area is closed — otherwise backing out from here
would drop the parent on the puzzle grid.

`App.tsx` renders it as the initial screen (`{ name: 'games' }`) and routes
`onSelectPuzzles` to `HomeScreen` and `onSelectMemory` to
[[MemoryHomeScreen]]. Both games now open on a landing page that lists
what there is to play, rather than dropping straight into a round.
`DemoApp.tsx` (the web demo) does the same.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `onSelectPuzzles` | `() => void` | no | Fired by the "Family Puzzle" tile. Absent → the tile absorbs taps silently. |
| `onSelectMemory` | `() => void` | no | Fired by the "Family Memory" tile. Same fallback. |
| `onOpenParentArea` | `() => void` | no | Fired by the corner parent button. Omitted → no button renders at all (the web demo has no parent area). |

No props control appearance; the layout is derived entirely from the
viewport.

## Toddler UX constraints

- Only two targets on the whole screen, each taking roughly half of it —
  far beyond the minimum touch target, separated from each other and from
  the screen edges by 10% of the shorter screen side.
- Each tile is identified by a large [[GameMark]] filling most of it; the
  text label is supporting, never required. The label gets 20dp of
  horizontal padding so it does not run into the tile's rounded edges in
  portrait, where tiles span the full screen width.
- Press feedback is immediate (`opacity: 0.7` while held).
- A tap on a tile with no handler wired does nothing at all — no error, no
  flash, no dead-looking button.
- No back button, so there is no way to leave the app's own content from
  here.

## Edge cases & expected behavior

- `onSelectPuzzles` / `onSelectMemory` omitted → the tile still renders and
  still presses; the press is a no-op.
- Portrait viewport (`height > width`) → tiles stack vertically.
- Landscape viewport → tiles sit side by side.
- Rotating the device → the layout flips on the next render, since
  `useWindowDimensions` re-renders on resize, and each tile re-measures via
  `onLayout` so its mark is resized to match. No state worth keeping is
  lost.
- Before the first layout pass, or if a tile is measured with less height
  than `LABEL_SPACE` (possible mid-rotation) → the mark size clamps to 0
  and the mark is not rendered, rather than asking Skia for a
  negative-sized canvas.
- A tile's face is always `colors.cream`; the game's colour appears only as
  its base stripe.
- No screen-reader-visible "Back" control is ever rendered here.

## Test scenarios

1. Launch the app → the game picker is the first screen, showing "Family
   Puzzle" and "Family Memory", each with its own brand mark on a cream
   tile.
2. Tap "Family Puzzle" → the puzzle grid opens, headed "Family Puzzle".
3. From the puzzle grid, tap Back → the game picker again.
4. Tap "Family Memory" → the memory landing page opens, listing one tile
   per round.
5. From the memory landing page, tap Back → the game picker again.
6. On the game picker, look for a Back control → there is none.
6a. Tap the corner parent button → `onOpenParentArea` is called. With it
   omitted, no "Parent controls" node is in the tree.
6b. Open the parent area from the picker, solve the gate, then Back →
   back on the picker (both game tiles present, no starter-puzzle tile).
   Doing the same from the puzzle grid returns to the grid.
7. Lay out a tile at 400x400 → its mark is sized 356 (400 − `LABEL_SPACE`).
8. At 393x852 the container is inset by 39 on all sides; at 1180x820 by 82
   — 10% of the shorter side in both cases.

## Non-goals / known limitations

- No per-game progress, badges, or "last played" — the tiles are static.
- Game order is hard-coded, not configurable from the parent area.
- The marks cannot be made much larger without dropping the text labels or
  going to one tile per screen: they already fill their tiles, and the
  tiles already fill the screen minus the 10% inset.

## Related

- Code: `src/screens/GameSelectScreen.tsx`
- Tests: `src/screens/GameSelectScreen.test.tsx`
- Related specs: [[GameMark]], [[gameMarkGeometry]], [[HomeScreen]], [[MemoryScreen]], [[AppHeader]]
