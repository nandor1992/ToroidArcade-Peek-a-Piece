/**
 * Web demo entry point (see docs/specs/app/DemoApp.md).
 *
 * `WithSkiaWeb` loads the CanvasKit WASM first and only then imports the app
 * — PuzzleBoard calls Skia at module scope, so mounting it before CanvasKit
 * is on `globalThis` would throw. The fallback below matches the boot markup
 * in index.html so the wait looks like one continuous screen.
 */
import { createRoot } from 'react-dom/client';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

const container = document.getElementById('root');
if (!container) {
  throw new Error('web/index.html is missing the #root element');
}

// Clear the static boot markup before React takes over the container.
container.innerHTML = '';

createRoot(container).render(
  <WithSkiaWeb
    getComponent={() => import('../src/app/DemoApp')}
    // Resolve canvaskit.wasm against the page URL rather than the domain
    // root, so the demo works when hosted under a sub-path (e.g. a GitHub
    // Pages project site at /<repo>/). CopyWebpackPlugin puts the .wasm
    // next to index.html.
    opts={{
      locateFile: (file: string) =>
        new URL(file, document.baseURI).toString(),
    }}
    fallback={<div className="boot">Retrieving Memories…</div>}
  />,
);
