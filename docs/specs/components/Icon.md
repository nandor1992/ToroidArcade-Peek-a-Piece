---
name: Icon
type: component
source: src/components/Icon.tsx
status: draft
last_verified: 2026-08-30
---

# Icon

## Purpose

One place that maps the app's *semantic* icon names (`back`, `parents`,
`volumeOff`, …) to actual glyphs, so screens never name an icon-set glyph
directly and the icon set can be swapped without touching them. Replaces
the emoji/arrow-character glyphs the screens used before.

## How it works

Wraps `MaterialDesignIcons` from
`@react-native-vector-icons/material-design-icons/static`. `GLYPHS` is the
semantic-name → MDI-glyph table; `Icon` looks the name up and renders the
glyph at `size` (default 24) in `color` (default `colors.navy`). It's
marked `accessibilityElementsHidden` / `importantForAccessibility="no-hide-descendants"`
because every use sits inside an already-labelled `Pressable` — the icon
is decoration, the button carries the label.

**Font registration** (needed for the glyph to render on a device):

- Android — `android/app/src/main/assets/fonts/MaterialDesignIcons.ttf`
  (committed to the repo; RN resolves `fontFamily` from there).
- iOS — the package's podspec bundles `fonts/*.ttf` on `pod install`, and
  `ios/PeekaPiece/Info.plist` lists `MaterialDesignIcons.ttf` under
  `UIAppFonts`.
- Adding the dependency also means running `pod install` (autolinking) and
  a native rebuild — the JS-only bits (this component, tests) work without
  it, but the glyphs won't show until the font is in the built app.

## Interface

| Name | Type | Required | Notes |
|------|------|----------|-------|
| `name` | `IconName` | Yes | `back` \| `home` \| `previous` \| `next` \| `reset` \| `parents` \| `settings` \| `volumeOn` \| `volumeOff` \| `close` |
| `size` | `number` | No | Default 24. |
| `color` | `string` | No | Default `colors.navy`. |

Current mapping: `back` / `previous` → `chevron-left`, `next` →
`chevron-right`, `home` → `home`, `reset` → `restart`, `parents` →
`account-supervisor`, `settings` → `cog`, `volumeOn` → `volume-high`,
`volumeOff` → `volume-off`, `close` → `close`. (`back` and `previous`
share a glyph but are kept distinct so callers read right: `back` = up one
screen, `previous` = the earlier puzzle.)

## Toddler UX constraints

- None of its own — it's always inside a large `Pressable` that owns the
  touch target and the accessibility label. The icon just has to read
  clearly at a glance (line-style glyphs, sized 22–30 in the buttons that
  use it).

## Edge cases & expected behavior

- Font not yet linked into the native app → nothing (or a missing-glyph
  box) renders; the surrounding button still works and is still labelled.

## Test scenarios

`src/components/Icon.test.tsx` renders every `IconName` and asserts the
resolved MDI glyph, against the manual mock
(`__mocks__/@react-native-vector-icons/material-design-icons/static.js`,
which renders the glyph name as text).

## Non-goals / known limitations

- No image-source / nav-bar-icon use (`Icon.getImageSource`) — just inline
  glyphs.
- Material Design Icons ships a ~1.3 MB font; that's the whole set bundled
  for the seven glyphs actually used. Acceptable for now.

## Related

- Code: `src/components/Icon.tsx`
- Tests: `src/components/Icon.test.tsx`
- Mock: `__mocks__/@react-native-vector-icons/material-design-icons/static.js`
- Related specs: [[AppHeader]], [[PuzzleScreen]], [[HomeScreen]], [[SettingsScreen]], [[ParentScreen]]
