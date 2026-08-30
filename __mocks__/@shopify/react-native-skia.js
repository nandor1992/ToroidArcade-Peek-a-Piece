// Manual mock so tests never touch the native Skia module (which needs a
// real CanvasKit/WASM or native binding neither present in Jest) — picked
// up automatically for any `require('@shopify/react-native-skia')` since
// it lives in a root-level __mocks__/@shopify/ directory.
//
// PuzzleBoard's actual interactive logic (hit-testing, dragging, snapping)
// lives entirely on the plain RN View wrapping the Canvas, via the
// Responder System — the Skia elements below are purely presentational,
// so this mock only needs to let the component mount without crashing,
// not faithfully render anything. See
// docs/specs/games/puzzle/components/PuzzleBoard.md.
const React = require('react');
const { View } = require('react-native');

function Canvas({ children, style }) {
  return React.createElement(View, { style }, children);
}

function Group({ children }) {
  return React.createElement(View, null, children);
}

function Image() {
  return null;
}

function Path() {
  return null;
}

function useImage() {
  return {
    width: () => 200,
    height: () => 200,
  };
}

module.exports = { Canvas, Group, Image, Path, useImage };
