module.exports = {
  preset: '@react-native/jest-preset',
  // The preset's own transformIgnorePatterns assumes a flat node_modules
  // layout; pnpm nests real packages under node_modules/.pnpm/, which the
  // unmodified pattern doesn't see past, so RN's own ESM source never gets
  // transformed. Teach the pattern to look past a `.pnpm/` segment too.
  // react-native-image-picker also ships untranspiled TS as its main entry
  // (like RN's own packages do), so it needs the same carve-out.
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm|(jest-)?react-native|@react-native(-community)?|react-native-image-picker)/)',
  ],
};
