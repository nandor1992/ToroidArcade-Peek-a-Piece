module.exports = {
  arrowParens: 'avoid',
  singleQuote: true,
  trailingComma: 'all',
  // Matches the React Native template style this codebase was written in:
  // a multi-line JSX open tag ends `]}>` rather than putting the `>` on a
  // line of its own. Without this, enforcing Prettier would rewrite every
  // component in the repo.
  bracketSameLine: true,
  // This repo has mixed line endings committed (`core.autocrlf` is false,
  // so what's on disk is what's in git) and normalising them is a separate
  // decision from formatting. 'auto' keeps whatever each file already uses,
  // so Prettier never turns a three-line edit into a whole-file diff.
  // If the repo is ever normalised — `.gitattributes` with
  // `* text=auto eol=lf` and one renormalise commit — change this to 'lf'.
  endOfLine: 'auto',
};
