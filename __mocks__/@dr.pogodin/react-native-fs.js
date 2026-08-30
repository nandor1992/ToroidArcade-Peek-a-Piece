// Manual in-memory filesystem mock — Jest picks it up automatically for
// any `@dr.pogodin/react-native-fs` import. Just enough of the API for
// src/storage/photoFiles.ts: a set of "existing" paths that copyFile
// adds to and unlink removes from. See docs/specs/storage/photoFiles.md.
const files = new Set();

const DocumentDirectoryPath = '/mock/Documents';

const mkdir = jest.fn(async () => {});

const exists = jest.fn(async path => files.has(path));

const copyFile = jest.fn(async (_from, to) => {
  files.add(to);
});

const unlink = jest.fn(async path => {
  if (!files.has(path)) {
    throw new Error(`ENOENT: ${path}`);
  }
  files.delete(path);
});

// Test helpers — not part of the real API.
function __seed(path) {
  files.add(path);
}
function __reset() {
  files.clear();
  mkdir.mockClear();
  exists.mockClear();
  copyFile.mockClear();
  unlink.mockClear();
}

module.exports = {
  __esModule: true,
  DocumentDirectoryPath,
  mkdir,
  exists,
  copyFile,
  unlink,
  __seed,
  __reset,
  __files: files,
};
