# Web demo

A browser-playable build of the **starter puzzles only** — no parent area, no
photo upload. Intended as a "try it before installing" page. Design notes:
[`docs/specs/app/DemoApp.md`](specs/app/DemoApp.md).

```
pnpm web:start     # dev server on http://localhost:8080  (8081 is Metro's)
pnpm web:build     # static site -> web/dist/
```

`web/dist/` is self-contained — upload it to any static host (GitHub Pages,
Netlify, Cloudflare Pages, S3). No server-side anything.

> **`react-dom` must be pinned to exactly the same version as `react`.**
> React refuses to start otherwise ("Incompatible React versions"), and it
> only shows up in the browser — the native build and the Jest suite never
> load `react-dom`, so every other check stays green. React Native pins
> `react` to an exact version, so `react-dom` is pinned exactly too (no
> caret). If you ever `pnpm add react-dom`, it will resolve to the latest
> patch and silently break the demo — use `pnpm add -E react-dom@<react's
> version>`.

All emitted URLs are **relative** (`publicPath: 'auto'`, a relative
`@font-face` src, and a `locateFile` that resolves `canvaskit.wasm` against
`document.baseURI`), so the same build works at a domain root *and* under a
sub-path like `https://<user>.github.io/<repo>/`.

## GitHub Pages

Browsing the repo on github.com will **not** run the demo — GitHub renders
source files, it doesn't execute them. You need Pages.

`web/dist/` is gitignored, so don't commit the build. Instead:

1. Repo **Settings → Pages → Source = "GitHub Actions"**.
2. Push to `master`. `.github/workflows/deploy-web.yml` installs, typechecks,
   runs `pnpm web:build`, and publishes `web/dist/` to Pages.
3. For this repo (`nandor1992/ToroidArcade-Peek-a-Piece`) the site lands at
   **https://nandor1992.github.io/ToroidArcade-Peek-a-Piece/**

The trunk branch here is **`master`**, which is what the workflow's
`on.push.branches` lists — keep the two in sync if the branch is ever
renamed. The workflow can also be run by hand from the Actions tab
(`workflow_dispatch`).

A `.nojekyll` file is emitted so the legacy branch-based Pages deploy doesn't
pipe the output through Jekyll.

## Host configuration that matters

- **Serve `.wasm` as `application/wasm`.** CanvasKit uses streaming
  instantiation and falls back slowly (or fails) without the right MIME type.
  Most hosts do this already; verify with
  `curl -sI <url>/canvaskit.wasm | grep -i content-type`.
- **Enable brotli or gzip.** Uncompressed the payload is ~13 MB — dominated by
  `canvaskit.wasm` (8 MB), the eight starter JPEGs (~2 MB) and the music track
  (3.1 MB). Brotli takes the WASM to roughly a third.
- The mp3 is only fetched after the first user gesture (browsers block
  autoplay), so it doesn't delay first paint.
- Everything except `index.html` is content-hashed, so it can be cached
  immutably; serve `index.html` with a short TTL.

**Cheapest further win:** downscale the starter JPEGs (currently ~1280px,
~250 KB each). They never render larger than a grid tile or a puzzle board.

## Verifying a build

`pnpm web:start`, then in the browser:

1. Home shows the eight starter puzzles and **no** parent button.
2. Opening one shows "Retrieving Memories…" then a playable board.
3. Drag / snap / merge works with mouse and touch.
4. Solving shows "🎉 Great job!" and a green tick on Home.
5. Reload → the tick persists (IndexedDB).
6. Music starts after the first click, pauses when the tab is hidden.
7. Icon glyphs render (not tofu boxes) — confirms the `@font-face` resolved.

The Jest suite runs against the **native** module graph and does not cover the
`.web.ts` shims, so steps 2–7 are genuinely manual.
