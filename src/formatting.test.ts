/**
 * @format
 *
 * Formatting guard: every source file Prettier owns must already be
 * formatted. Prettier lives in `.prettierrc.js`; eslint only *disables* the
 * rules Prettier owns (via `@react-native`'s `eslint-config-prettier`), so
 * without this test nothing in `npm test` would catch a badly formatted file.
 *
 * Run `npx prettier --write .` (or `npm run format`) to fix a failure — the
 * message names every offending file.
 *
 * Markdown is deliberately out of scope: `docs/` is hand-wrapped prose and
 * Prettier would reflow it. See docs/specs/formatting.md.
 */

import { promises as fs } from 'fs';
import path from 'path';
import prettier from 'prettier';

const ROOT = path.resolve(__dirname, '..');

/** Directories Prettier should own, relative to the repo root. */
const ROOTS = ['src', '__mocks__'];
/** Plus the config files that sit loose at the top level. */
const LOOSE_FILES = [
  'jest.config.js',
  'metro.config.js',
  'webpack.config.js',
  'babel.config.js',
  '.prettierrc.js',
  '.eslintrc.js',
];

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const SKIP_DIRS = new Set(['node_modules', 'build', 'android', 'ios']);

async function sourceFiles(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return []; // an optional root that doesn't exist in this checkout
  }
  const found = await Promise.all(
    entries.map(async entry => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return SKIP_DIRS.has(entry.name) ? [] : sourceFiles(full);
      }
      return EXTENSIONS.includes(path.extname(entry.name)) ? [full] : [];
    }),
  );
  return found.flat();
}

test('every source file is Prettier-formatted', async () => {
  const fromRoots = await Promise.all(
    ROOTS.map(root => sourceFiles(path.join(ROOT, root))),
  );
  const loose = await Promise.all(
    LOOSE_FILES.map(async name => {
      const full = path.join(ROOT, name);
      return (await fs
        .access(full)
        .then(() => true)
        .catch(() => false))
        ? [full]
        : [];
    }),
  );
  const files = [...fromRoots.flat(), ...loose.flat()];

  // A guard that silently checks nothing is worse than no guard — if the
  // walk breaks, this is what says so.
  expect(files.length).toBeGreaterThan(20);

  const unformatted: string[] = [];
  for (const file of files) {
    const source = await fs.readFile(file, 'utf8');
    const options = await prettier.resolveConfig(file);
    if (!prettier.check(source, { ...options, filepath: file })) {
      unformatted.push(path.relative(ROOT, file).replace(/\\/g, '/'));
    }
  }

  expect(unformatted).toEqual([]);
}, 60000);
