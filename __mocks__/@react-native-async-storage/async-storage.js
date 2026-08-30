// Manual in-memory mock — Jest picks it up automatically for any
// `@react-native-async-storage/async-storage` import. The real package
// ships only an ESM build (no lib/commonjs), which this project's
// transformIgnorePatterns don't cover, so a hand-rolled mock is simpler
// than teaching Jest to transform it. See docs/specs/storage/asyncStore.md.
const store = new Map();

const AsyncStorage = {
  getItem: jest.fn(async key => (store.has(key) ? store.get(key) : null)),
  setItem: jest.fn(async (key, value) => {
    store.set(key, String(value));
  }),
  removeItem: jest.fn(async key => {
    store.delete(key);
  }),
  clear: jest.fn(async () => {
    store.clear();
  }),
  getAllKeys: jest.fn(async () => Array.from(store.keys())),
  // Test helper — not part of the real API. Clears the store *and* the
  // recorded calls on every mocked method.
  __reset: () => {
    store.clear();
    AsyncStorage.getItem.mockClear();
    AsyncStorage.setItem.mockClear();
    AsyncStorage.removeItem.mockClear();
    AsyncStorage.clear.mockClear();
    AsyncStorage.getAllKeys.mockClear();
  },
};

module.exports = {
  __esModule: true,
  default: AsyncStorage,
};
