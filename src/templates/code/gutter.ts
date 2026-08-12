import type { CodeToken } from "../../highlight/index.js";
import type { ResolvedConfig } from "../../types.js";

/** How faint the numbers are against the code beside them. */
const numberOpacity = 0.4;

/** Columns of clear space between the numbers and the code. */
const numberGap = 2;

/**
 * Width of the gutter in characters, or none where the config wants no
 * numbers.
 *
 * It is taken from the whole snippet rather than from the lines that survive
 * fitting, so the gutter is the width the numbering needs rather than the
 * width it happens to use: a snippet cut off at line 9 of 40 still reserves
 * two digits, and the code does not shift when a line is dropped.
 */
export function gutterColumns(config: ResolvedConfig, lines: number): number {
  return config.code.lineNumbers
    ? String(Math.max(1, lines)).length + numberGap
    : 0;
}

/** One line's number, right-aligned in the digits the gutter reserves. */
function numberToken(line: number, columns: number): CodeToken {
  const text = String(line);

  return {
    text,
    column: columns - numberGap - text.length,
    // No colour of its own, so `codeBody` draws it in the theme's foreground
    // and the opacity is what holds it back from the code.
    color: undefined,
    opacity: numberOpacity,
    bold: false,
    italic: false,
  };
}

/**
 * Move the code across by the width of the gutter and put a number in front of
 * each line.
 *
 * The numbers are tokens on the same character grid as the code rather than
 * text placed alongside it, which is what keeps them on the baselines the code
 * is drawn on: there is one piece of arithmetic for where a line sits, and it
 * stays in `codeBody` where it already was.
 *
 * A snippet that had lines dropped ends with the truncation marker, and that
 * line is left unnumbered: it stands for the lines that are not shown, so a
 * number of its own would be a number nothing has.
 *
 * A gutter of no columns is a snippet with the numbers turned off, and the
 * lines come back untouched.
 */
export function numberLines(
  lines: readonly (readonly CodeToken[])[],
  columns: number,
  dropped: number,
): readonly (readonly CodeToken[])[] {
  if (columns === 0) {
    return lines;
  }

  const numbered = lines.length - (dropped > 0 ? 1 : 0);

  return lines.map((tokens, index) => {
    const shifted = tokens.map((token) => ({
      ...token,
      column: token.column + columns,
    }));

    return index < numbered
      ? [numberToken(index + 1, columns), ...shifted]
      : shifted;
  });
}
