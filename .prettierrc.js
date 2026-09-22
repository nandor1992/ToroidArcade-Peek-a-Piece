module.exports = {
  arrowParens: 'avoid',
  singleQuote: true,
  trailingComma: 'all',
  // Matches the React Native template style this codebase was written in:
  // a multi-line JSX open tag ends `]}>` rather than putting the `>` on a
  // line of its own. Without this, enforcing Prettier would rewrite every
  // component in the repo.
  bracketSameLine: true,
  // LF, matching `.gitattributes` (`* text=auto eol=lf`). The two have to
  // agree: if Prettier wrote CRLF, every file it touched would come back
  // dirty the moment git normalised it again.
  endOfLine: 'lf',
};
