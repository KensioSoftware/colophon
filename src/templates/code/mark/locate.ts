import type { CodeToken } from "../../../highlight/index.js";
import type { CodeMark } from "./read.js";

/** Where a mark landed on the character grid, once it was found. */
export interface MarkSpan {
  /** Zero-based, into the lines being drawn. */
  readonly line: number;
  readonly column: number;
  /** Characters, or `undefined` for the whole line. */
  readonly length: number | undefined;
  readonly color: string | undefined;
}

/**
 * One line as plain text, rebuilt from the tokens by putting each back at its
 * own column.
 *
 * The tokens are what survived highlighting, fitting and clipping, so this is
 * the line as it will be drawn rather than as it was written. Searching what
 * is drawn is the point: a mark on a line that was dropped has nowhere to go,
 * and finding it in the original snippet would only mean drawing a box in the
 * wrong place.
 */
function lineText(tokens: readonly CodeToken[]): string {
  let text = "";

  for (const token of tokens) {
    text = text.padEnd(token.column, " ") + token.text;
  }

  return text;
}

/** The first line holding the text, and where on it. */
function findText(
  text: string,
  lines: readonly (readonly CodeToken[])[],
): { line: number; column: number } | undefined {
  for (const [line, tokens] of lines.entries()) {
    const column = lineText(tokens).indexOf(text);

    if (column !== -1) {
      return { line, column };
    }
  }

  return undefined;
}

/**
 * Turn a declared mark into grid coordinates, or nothing where it names
 * something the image does not show.
 *
 * A mark naming a line and no column is the whole line, which is the band an
 * editor draws rather than a box around a word.
 */
export function locateMark(
  mark: CodeMark,
  lines: readonly (readonly CodeToken[])[],
): MarkSpan | undefined {
  const color = mark.color;

  if (mark.text !== undefined) {
    const found = findText(mark.text, lines);

    return found === undefined
      ? undefined
      : { ...found, length: mark.length ?? mark.text.length, color };
  }

  const line = (mark.line ?? 0) - 1;

  if (line < 0 || line >= lines.length) {
    return undefined;
  }

  return mark.column === undefined
    ? { line, column: 0, length: undefined, color }
    : {
        line,
        column: mark.column - 1,
        length: mark.length ?? 1,
        color,
      };
}
