# Architecture

## What this app is

A React Native app where a parent uploads family photos and the app turns
them into simple games for a toddler to play. Jigsaw puzzles first; more game
types later (matching, sliding tiles, spot-the-difference, etc.).

## Branding

The app is called **Peek-a-Piece**. Source files (icon SVG/PNG, colour and
type spec) live in [`resources/`](../resources/); the app icon and native
project names are generated from them (see below) rather than hand-copied, so
`resources/` is the source of truth if the icon or palette changes.

**Name.** Peekaboo is the first game almost every toddler learns, and it
works on the same idea as a jigsaw: something hidden, then revealed. The name
says the mechanic and the age group in three syllables.

**Icon.** A jigsaw piece with someone hiding behind it — two eyes peeking
over the top edge. The eyes do the work: they signal a person, a game, and a
face to look for, which is what the app is about. One large shape,
deliberately, so it survives being shrunk to a home-screen icon.
`resources/peekapiece-icon.svg` is the master vector; `peekapiece-mark.svg`
is the eyes+piece mark alone (no background), for contexts that need just
the glyph. The native app icons
(`android/app/src/main/res/mipmap-*/ic_launcher*.png` and
`ios/PeekaPiece/Images.xcassets/AppIcon.appiconset/`) are rendered from this
vector at each required size — Android keeps the icon's own rounded-corner
silhouette with transparent corners (legacy launcher icons, no adaptive-icon
XML in this project yet); iOS uses a full-bleed square with no alpha
channel, since iOS applies its own corner mask and the App Store rejects
icons with transparency.

**Colour.** Warm, high-contrast, chosen to stay distinguishable under the
most common forms of colour blindness (the palette differs in lightness as
well as hue, not just hue):

| Name      | Hex       | Use                                  |
|-----------|-----------|---------------------------------------|
| Sunbeam   | `#FFC93C` | icon field, primary background       |
| Tangerine | `#FF9F1C` | gradient base, active states         |
| Teal      | `#2EC4B6` | the piece, primary UI                |
| Navy      | `#26385A` | eyes, all text                       |
| Coral     | `#FF6B6B` | piece colour 2, celebration           |
| Violet    | `#9B5DE5` | piece colour 3                       |
| Leaf      | `#7BC950` | piece colour 4                       |
| Cream     | `#FFF6E6` | page background                      |

**Type.** [Fredoka](https://fonts.google.com/specimen/Fredoka) (display —
wordmark, buttons, anything a child sees) and
[Nunito](https://fonts.google.com/specimen/Nunito) (body — parent-facing
settings, help text, store listing). Neither is wired into the app yet;
`src/theme/` is still empty (see below) — pick these up when the theme
provider is built.

These become real `src/theme/` tokens (colours, type scale) once that layer
is implemented — see "Open decisions" below. Until then this table is the
source of truth for any hardcoded styling in early screens.

**Build notes carried over from the brand sheet**, worth keeping in mind
before the photo-upload feature is built: an app aimed at children has legal
obligations ordinary apps don't (COPPA in the US, the UK's Children's code,
GDPR-K in the EU), and app store family-policy programs require declaring a
target age group — read the relevant policy before writing the upload flow,
not after. No third-party ad SDKs, no fingerprinting analytics, no external
links in the child-facing view; keep anything parental behind a simple gate.

## Key decisions

**Bare React Native CLI, not Expo.** Chosen for full control over native
touch handling (puzzle piece drag/snap needs to feel forgiving and immediate
for small hands) without Expo's native-module constraints. Means `android/`
and `ios/` are real native projects in this repo, owned by build tooling, not
hand-edited. Current stack, as scaffolded by `react-native init`: RN 0.87,
React 19.2, TypeScript, pnpm, Jest via `@react-native/jest-preset`,
ESLint/Prettier via `@react-native/eslint-config`.

**`App.tsx` and `index.js` stay at the repo root.** This is the RN CLI
convention — `index.js` registers the root component RN's native side looks
for, and moving it doesn't buy anything. `src/app/` holds the providers and
root navigation setup (theme provider, navigation container, etc.) that
`App.tsx` composes once they exist; today `App.tsx` is still the unmodified
RN template placeholder (`NewAppScreen`), so `src/app/` is empty until the
first real screen is wired in.

**Local-only storage, no backend.** Photos and puzzle progress live entirely
on-device. No accounts, no auth, no upload to any server. This is a deliberate
privacy stance (the content is photos of children) and it also removes an
entire category of complexity: no API, no sync conflicts, no server-side
specs to maintain. If cross-device sync is wanted later, treat it as an
opt-in layer added on top of a working offline-first app, not a foundation.

**Games are self-contained plugins under `src/games/<name>/`.** Each game
owns its own `components/` and `logic/` and exposes a small entry point
(`index.ts`). The goal: adding a second or third game type should mean adding
a new folder, not touching the puzzle game's code. `src/games/puzzle/` is the
first and, for now, only implementation of this pattern — treat it as the
reference example when adding the next game.

**Runs full screen, with no system chrome.** The app hides the status bar
and (Android) the navigation bar / (iOS) home indicator, so the whole
display is the app and nothing system-drawn overlaps the UI — in
particular `HomeScreen`'s corner parent-area button, which a bottom
navigation bar used to cover. This needs small, deliberate native edits
(the same footing as bundling the music file):

- Android — `MainActivity.onCreate` / `onWindowFocusChanged` call
  `WindowInsetsControllerCompat.hide(systemBars())` with
  `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE` (sticky immersive: a parent can
  still swipe from an edge to get the bars back briefly). Re-hidden on
  every focus regain because Android restores the bars after dialogs / the
  keyboard / recents.
- iOS — `Info.plist` sets `UIStatusBarHidden` and `UIRequiresFullScreen`;
  the React root view controller is a `FullScreenViewController` subclass
  (wired via `createRootViewController` in `AppDelegate.swift`) that
  returns `true` from `prefersStatusBarHidden` and
  `prefersHomeIndicatorAutoHidden`.
- JS — `App.tsx` renders `<StatusBar hidden />` so RN agrees with the
  native side.

**Toddler-first UX is a first-class constraint, not a detail.** Large touch
targets, forgiving input (mis-taps do nothing rather than showing an error),
minimal-to-no text dependency, and clear audio/visual feedback are baseline
requirements for every screen and game component — see the "Toddler UX
constraints" section required in every spec.

## Open decisions (for the install/setup session or first implementation pass)

- **State management**: not yet chosen. Given the app's small scope, plain
  React Context + hooks or a lightweight store (e.g. Zustand) are both
  reasonable; avoid anything that assumes a backend (Redux-with-thunks-for-
  API-calls patterns are unnecessary overhead here).
- **Local persistence**: photo references + puzzle progress need a small
  local store — `react-native-mmkv` (fast key-value) or SQLite (e.g.
  `op-sqlite`) if querying structured puzzle/progress data turns out to
  matter. Actual photo bytes should stay wherever the OS photo picker leaves
  them (or a copy in app-private storage) rather than duplicated into a DB.
- **Navigation library**: `@react-navigation/native` is the de facto standard
  for bare RN and is assumed by the folder layout (`src/navigation/`), but
  hasn't been installed yet as of this doc.

Record the actual choice in this file once made — this doc is itself subject
to the same "keep it current" expectation as a component spec.
