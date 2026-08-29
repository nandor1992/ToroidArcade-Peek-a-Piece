# Starter puzzle artwork

One image per bundled starter puzzle (`STARTER_PUZZLES` in
`src/screens/HomeScreen.tsx`). Each is shown as a Home tile and cut into
jigsaw pieces by `PuzzleBoard`. Eight of them — a full 4x2 grid on a
tablet.

| File | Puzzle | Scene |
|------|--------|-------|
| `meadow.jpg` | Meadow | walking a country path along a field |
| `fairground.jpg` | Fairground | little kids' fairground ride, purple double-decker |
| `climbing.jpg` | Climbing | child climbing a rope net on a wooden playframe |
| `tractor.jpg` | Tractor | child at a wooden play tractor, hills behind |
| `sandpit.jpg` | Sandpit | child playing in an indoor sandpit |
| `train.jpg` | Train | mother and child in a little park train |
| `theatre.jpg` | Theatre | child watching a stage show, plush toy in hand |
| `teddies.jpg` | Teddies | child with cuddly toys by a cot |

## Replacing the artwork

These are hand-illustrated cartoons, resized to ~1280px on the long edge
and saved as JPEG (~250 KB each) to keep the app bundle small. To swap
one out:

1. Export a new image (JPEG; roughly 1000–1400px on the long edge is
   plenty — the board and tiles render it `cover`, so aspect ratio just
   gets cropped).
2. Overwrite the file, **keeping the exact same name**.
3. No code change needed — `require()` picks it up. Re-run `npm test` and
   rebuild the app.

To add or remove a puzzle, edit `STARTER_PUZZLES` (and add/remove the
image here). Keep everything redistribution-safe (original art or suitably
licensed) — it ships inside the app binary.
