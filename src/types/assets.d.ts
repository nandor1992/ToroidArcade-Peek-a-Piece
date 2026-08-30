/**
 * Ambient declarations for assets imported as ES modules. The webpack web
 * build (see webpack.config.js) turns these into emitted files and hands
 * back their URL; Metro/native code uses `require()` for images instead and
 * is unaffected by these declarations.
 */

declare module '*.mp3' {
  const url: string;
  export default url;
}

declare module '*.ttf' {
  const url: string;
  export default url;
}
