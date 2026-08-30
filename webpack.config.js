/**
 * Webpack config for the **web demo** build (see docs/specs/app/DemoApp.md).
 *
 * Deliberately additive: nothing here is used by the Metro/native build, so
 * `pnpm android` / `pnpm ios` are unaffected. Entry point is web/index.tsx.
 */
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// React Native and several RN libraries ship untranspiled source (Flow types,
// ESM, JSX), so unlike a normal web project these *must* go through Babel.
const RN_PACKAGES_NEEDING_TRANSPILE = [
  'react-native',
  'react-native-web',
  'react-native-safe-area-context',
  '@react-native',
  '@react-native-async-storage',
  '@react-native-vector-icons',
  '@shopify/react-native-skia',
];

// Matches node_modules/<pkg>/... for each of the above. pnpm's hoisted layout
// (see .npmrc) keeps them at the top level, but the regex tolerates nesting.
const transpileRegex = new RegExp(
  `node_modules[\\\\/](${RN_PACKAGES_NEEDING_TRANSPILE.map(p =>
    p.replace(/[/\\]/g, '[\\\\/]').replace(/[.*+?^${}()|[\]]/g, '\\$&'),
  ).join('|')})[\\\\/]`,
);

module.exports = (_env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    entry: path.resolve(__dirname, 'web/index.tsx'),
    output: {
      path: path.resolve(__dirname, 'web/dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      // Hashed asset filenames so a static host can cache them hard.
      assetModuleFilename: 'assets/[name].[hash][ext]',
      // 'auto' emits *relative* URLs rather than absolute ones. Required for
      // hosting under a sub-path — a GitHub Pages project site lives at
      // https://<user>.github.io/<repo>/, where '/main.js' would 404 against
      // the domain root. Also keeps `file://` and any sub-directory host working.
      publicPath: 'auto',
      clean: true,
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    resolve: {
      // `react-native` -> `react-native-web`. The `$` makes it exact, so deep
      // imports such as react-native/Libraries/... still resolve natively for
      // any library that reaches for them.
      alias: {
        'react-native$': 'react-native-web',
        // Skia's Platform.web.js requires this to turn a Metro numeric asset
        // id into a URL. Webpack assets are already URL strings so that
        // branch is dead here, but the require still has to resolve — and
        // RN 0.87 no longer exposes the subpath. react-native-web's own
        // AssetRegistry exports the same `getAssetByID`.
        'react-native/Libraries/Image/AssetRegistry$':
          'react-native-web/dist/modules/AssetRegistry',
      },
      // CanvasKit's Emscripten glue has a Node branch it never takes in a
      // browser; webpack 5 no longer auto-polyfills core modules.
      fallback: {
        fs: false,
        path: false,
        // Optional peers that this app deliberately does not install. Each
        // guards a code path we never take, but webpack still tries to
        // resolve them; stubbing keeps the build output clean so a real
        // warning stands out.
        //   - get-image / assets-registry / expo-font: vector-icons paths for
        //     nav-bar image icons and dynamic font loading. Icon.tsx renders
        //     inline glyphs (docs/specs/components/Icon.md) and the font is
        //     loaded by the @font-face rule in web/index.html.
        //   - react-native-worklets / react-native-reanimated: optional Skia
        //     peers (see its peerDependenciesMeta); the board uses no
        //     animated Skia values.
        '@react-native-vector-icons/get-image': false,
        '@react-native/assets-registry/registry': false,
        'expo-font': false,
        'react-native-worklets': false,
        'react-native-reanimated': false,
        'react-native-reanimated/package.json': false,
      },
      // `.web.*` must come first: Skia and safe-area-context both ship web
      // implementations as platform files (Skia.web.js, SafeAreaView.web.js),
      // and our own shims (useBackgroundMusic.web.ts, photoFiles.web.ts)
      // rely on the same mechanism.
      extensions: [
        '.web.tsx',
        '.web.ts',
        '.web.jsx',
        '.web.js',
        '.tsx',
        '.ts',
        '.jsx',
        '.js',
        '.json',
      ],
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          include: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, 'web'),
            path.resolve(__dirname, 'App.tsx'),
          ],
          use: {
            loader: 'babel-loader',
            // Reuses the project's babel.config.js
            // (module:@react-native/babel-preset).
            options: { cacheDirectory: true },
          },
        },
        {
          test: /\.[jt]sx?$/,
          include: transpileRegex,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              // These packages are outside the project root, so don't let
              // Babel go looking for their own configs.
              babelrc: false,
              configFile: false,
              presets: [require.resolve('@react-native/babel-preset')],
            },
          },
        },
        {
          test: /\.(png|jpe?g|gif|svg|mp3|ttf|woff2?)$/,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(!isProduction),
        'process.env.NODE_ENV': JSON.stringify(
          isProduction ? 'production' : 'development',
        ),
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'web/index.html'),
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            // LoadSkiaWeb imports canvaskit-wasm/bin/full/canvaskit, which
            // fetches canvaskit.wasm next to the bundle at runtime. Note
            // `bin/full/`, not `bin/` — they are different builds.
            from: path.resolve(
              __dirname,
              'node_modules/canvaskit-wasm/bin/full/canvaskit.wasm',
            ),
            to: path.resolve(__dirname, 'web/dist'),
          },
          {
            // Icon font at a stable path so the @font-face in web/index.html
            // can reference it. `createIconSet` resolves fontFamily to the
            // PostScript name 'MaterialDesignIcons' on web, which is what
            // that rule declares.
            from: path.resolve(
              __dirname,
              'node_modules/@react-native-vector-icons/material-design-icons/fonts/MaterialDesignIcons.ttf',
            ),
            to: path.resolve(__dirname, 'web/dist/fonts'),
          },
          {
            // Tells GitHub Pages' legacy branch-based deploy not to run the
            // output through Jekyll. Harmless elsewhere.
            from: path.resolve(__dirname, 'web/.nojekyll'),
            to: path.resolve(__dirname, 'web/dist'),
            toType: 'dir',
            noErrorOnMissing: true,
          },
        ],
      }),
    ],
    devServer: {
      static: { directory: path.resolve(__dirname, 'web/dist') },
      historyApiFallback: true,
      // Not 8081 — that's Metro's default, and you may well want the native
      // packager and the web demo running at the same time.
      port: 8080,
      open: false,
      hot: true,
    },
    performance: {
      // canvaskit.wasm alone is ~8 MB; the default 250 KB budget would bury
      // real warnings under noise. See docs/RELEASE.md for the size notes.
      hints: false,
    },
  };
};
