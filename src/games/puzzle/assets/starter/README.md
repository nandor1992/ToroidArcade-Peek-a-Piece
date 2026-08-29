# Starter puzzle artwork

One image per bundled starter puzzle (`STARTER_PUZZLES` in
`src/screens/HomeScreen.tsx`). Each is shown as a Home tile and cut into
jigsaw pieces by `PuzzleBoard`.

| File | Puzzle | Scene it stands in for |
|------|--------|------------------------|
| `meadow.png` | Meadow | toddler walking through tall meadow grass |
| `fairground.png` | Fairground | little kids' fairground carousel ride |
| `climbing.png` | Climbing | child climbing a rope net at a woodland playground |
| `dinosaur.png` | Dinosaur | child beside a big rusty triceratops sculpture |
| `tractor.png` | Tractor | child at a wooden play tractor, mountains behind |
| `teddies.png` | Teddies | child holding cuddly toys by a cot |
| `christmas.png` | Christmas | child by a decorated Christmas tree |

## Replacing the placeholders

The committed files are flat-colour placeholders (a labelled circle). To
drop in the real cartoon illustrations:

1. Export each as a **square PNG** (≥ 900×900; they're rendered `cover` so
   off-square just gets cropped).
2. Overwrite the file **keeping the exact same name**.
3. No code change needed — `require()` picks them up. Re-run
   `npm test` and rebuild the app.

Keep these redistribution-safe (original art or suitably licensed) — they
ship inside the app binary.
