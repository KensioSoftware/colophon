import type { CodeToken } from "../../../highlight/index.js";
import type { Advance } from "../advance.js";
import { columnX, lineText } from "../extent.js";
import type { CodeMark } from "./read.js";

/** Where a mark landed on the drawn snippet, once it was found. */
export interface MarkSpan {
  /** Zero-based, into the lines being drawn. */
  readonly line: number;
  /** How far along the line the mark starts, as a multiple of the size. */
  readonly x: number;
  /** How much of the line it covers, or `undefined` for the whole of it. */
  readonly width: number | undefined;
  readonly color: string | undefined;
}

/**
 * The first line holding the text, and which character of it it starts at.
 *
 * The tokens are what survived highlighting, fitting and clipping, so this
 * searches the line as it will be drawn rather than as it was written.
 * Searching what is drawn is the point: a mark on a line that was dropped has
 * nowhere to go, and finding it in the original snippet would only mean
 * drawing a box in the wrong place.
 */
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
 * A run of characters on one line, measured. A mark is declared in characters,
 * since that is how somebody reads a snippet, and drawn at whatever width the
 * face gives them.
 */
function spanOf(
  found: { line: number; column: number },
  length: number,
  lines: readonly (readonly CodeToken[])[],
  advance: Advance,
  color: string | undefined,
): MarkSpan {
  const tokens = lines[found.line] ?? [];
  const x = columnX(tokens, found.column, advance);

  return {
    line: found.line,
    x,
    width: columnX(tokens, found.column + length, advance) - x,
    color,
  };
}

/**
 * Turn a declared mark into coordinates on the drawn snippet, or nothing where
 * it names something the image does not show.
 *
 * A mark naming a line and no column is the whole line, which is the band an
 * editor draws rather than a box around a word.
 */
export function locateMark(
  mark: CodeMark,
  lines: readonly (readonly CodeToken[])[],
  advance: Advance,
): MarkSpan | undefined {
  const color = mark.color;

  if (mark.text !== undefined) {
    const found = findText(mark.text, lines);

    return found === undefined
      ? undefined
      : spanOf(found, mark.length ?? mark.text.length, lines, advance, color);
  }

  const line = (mark.line ?? 0) - 1;

  if (line < 0 || line >= lines.length) {
    return undefined;
  }

  return mark.column === undefined
    ? { line, x: 0, width: undefined, color }
    : spanOf(
        { line, column: mark.column - 1 },
        mark.length ?? 1,
        lines,
        advance,
        color,
      );
}
