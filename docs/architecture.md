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
vector at each required size. Android has both: the legacy
`mipmap-*/ic_launcher.png` (API < 26) **and** an adaptive icon
(`mipmap-anydpi-v26/ic_launcher*.xml`) whose foreground
(`drawable/ic_launcher_foreground.xml`) is a hand-transcribed
`VectorDrawable` of `resources/peekapiece-mark.svg` scaled into the 108dp
safe zone, over a solid `#FFC93C` (`@color/ic_launcher_background`) — so
modern launchers show a proper masked icon, not a shrunk square. iOS uses
a full-bleed square with no alpha channel, since iOS applies its own
corner mask and the App Store rejects icons with transparency.

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

Concretely (as of the persistence pass):

- **`@react-native-async-storage/async-storage`** holds the small JSON state
  that must survive a relaunch — the uploaded-puzzle list
  (`@peekapiece/userPuzzles`) and the set of solved puzzle ids
  (`@peekapiece/completedPuzzleIds`). Chosen over MMKV/SQLite for ubiquity;
  the data is tiny and unstructured. Settings choices (volume, timer, puzzle
  size, starter-puzzles toggle) are still deliberately session-only.
- **Photo bytes are copied into app-private storage**, not left at the
  picker's temp URI (which the OS can purge). On upload, the file is copied
  to `<DocumentDirectoryPath>/puzzles/<puzzleId>.jpg` via
  **`@dr.pogodin/react-native-fs`** (the maintained fork of the abandoned
  `react-native-fs`); the stored `imageUri` points at that copy, and deleting
  a puzzle deletes its file.
- `src/storage/` holds the pure load/save/copy helpers; `usePersistentPuzzles`
  (`src/hooks/`) is the single hook `App.tsx` uses to hydrate on launch and
  persist on every change. See `docs/specs/storage/` and
  `docs/specs/hooks/usePersistentPuzzles.md`.
- Both libraries autolink (no manual native edits) but need a native rebuild
  after install, and `pod install` for iOS.

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

**Icons via `@react-native-vector-icons/material-design-icons`.** UI
glyphs (back / next chevrons, the parent-area figure, the settings cog,
the volume icons) are Material Design Icons, wrapped by a single
`src/components/Icon.tsx` that maps the app's *semantic* names to glyphs —
screens never name a glyph directly. The `/static` entry point is used,
so rendering is pure JS (`<Text>` in the icon font); the font is
registered per-platform (`android/app/src/main/assets/fonts/`, iOS
`UIAppFonts` + the package's podspec). Adding it needs `pod install` and a
native rebuild. Every child-facing screen also opens with a slim
`src/components/AppHeader.tsx` (the mark + "Peek-a-Piece").

**A web demo build, via react-native-web + Webpack.** There is a second,
browser-hostable entry point: `src/app/DemoApp.tsx`, bundled by
`webpack.config.js` into a static `web/dist/` (`pnpm web:build`). It is
deliberately **demo-scope** — the eight bundled starter puzzles only, no
parent area and no photo upload — so the app can be tried without installing
it. See [`docs/specs/app/DemoApp.md`](specs/app/DemoApp.md).

- **Why a separate root rather than reusing `App.tsx`:** three native
  dependencies have no web build (`react-native-image-picker`,
  `@dr.pogodin/react-native-fs`, `react-native-sound`) and `Alert` is absent
  from react-native-web. By not importing the parent-facing screens, the demo
  needs exactly **one** real shim (audio) instead of four.
- **Ported for free:** Skia renders the board through CanvasKit/WASM (it ships
  `.web.js` platform files); AsyncStorage v3 falls back to IndexedDB, so
  completion ticks persist; safe-area-context ships web files; `AppState` maps
  to the Page Visibility API.
- **Shims are platform files, not branches** — `useBackgroundMusic.web.ts`,
  `photoFiles.web.ts`. Webpack resolves `.web.*` first, so native code paths
  are untouched and there are no `Platform.OS` conditionals in shared code.
- **Additive by construction:** Metro and the native builds never read
  `webpack.config.js` or `web/`, so `pnpm android` / `pnpm ios` are unaffected.
- **Trade-off accepted:** `canvaskit.wasm` is ~8 MB uncompressed. Serve the
  demo with brotli/gzip; see `docs/web-demo.md` for the payload notes.

**Toddler-first UX is a first-class constraint, not a detail.** Large touch
targets, forgiving input (mis-taps do nothing rather than showing an error),
minimal-to-no text dependency, and clear audio/visual feedback are baseline
requirements for every screen and game component — see the "Toddler UX
constraints" section required in every spec.

**Releasing to Google Play.** The app id is **`com.toroidarcade.peekapiece`**
(permanent once published; `namespace` + `applicationId` in
`android/app/build.gradle`, and the Kotlin package). It is a **children's
app** → Google Play **Families Policy** applies in full; the code is built
to comply (no network, no analytics/ads/crash SDKs, all storage local,
parental actions behind a math gate — see `ParentGateScreen`). Release
mechanics:

- **Signing**: `android/app/build.gradle` reads an upload key from
  `android/keystore.properties` (gitignored; `.example` committed). Absent
  that file it falls back to the debug key so a fresh clone still builds —
  that fallback is never publishable.
- **Permissions**: only `INTERNET` (declared, unused for data). The
  manifest explicitly `tools:node="remove"`s the `WRITE_EXTERNAL_STORAGE`
  that `@dr.pogodin/react-native-fs` would otherwise merge in — the app
  only writes to its own `DocumentDirectoryPath`.
- **Cold start**: `Theme.App.SplashScreen` (brand background + mark) is the
  window theme until `MainActivity.onCreate` swaps to `AppTheme`, so there's
  no white flash while Hermes + Skia start.
- **Crash safety**: `src/components/ErrorBoundary.tsx` wraps the app so a JS
  exception shows a parent-facing recovery screen, not a white screen.
- Full checklist + per-release steps: [`docs/web-demo.md`](web-demo.md).
  Privacy policy draft: [`docs/legal/privacy-policy.md`](legal/privacy-policy.md).

## Open decisions (for the install/setup session or first implementation pass)

- **State management**: not yet chosen. Given the app's small scope, plain
  React Context + hooks or a lightweight store (e.g. Zustand) are both
  reasonable; avoid anything that assumes a backend (Redux-with-thunks-for-
  API-calls patterns are unnecessary overhead here).
- ~~**Local persistence**~~: **decided** — `@react-native-async-storage/async-storage`
  for the JSON state, `@dr.pogodin/react-native-fs` to copy photo bytes into
  `<DocumentDirectoryPath>/puzzles/`. See "Local-only storage" under Key
  decisions above.
- **Navigation library**: `@react-navigation/native` is the de facto standard
  for bare RN and is assumed by the folder layout (`src/navigation/`), but
  hasn't been installed yet as of this doc.

Record the actual choice in this file once made — this doc is itself subject
to the same "keep it current" expectation as a component spec.
