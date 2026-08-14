import type { CodeToken } from "../../highlight/index.js";
import type { Advance } from "./advance.js";

/** One token of a line, and how far along the line it starts. */
export interface PlacedToken {
  readonly token: CodeToken;
  readonly x: number;
}

/**
 * One line as plain text, rebuilt by putting each token back at its own
 * column.
 *
 * What sits between two tokens is the snippet's own indentation: the
 * highlighter drops whitespace-only runs and keeps the column they ended at,
 * and tabs were expanded to spaces before that, so padding the gaps with
 * spaces gives the line back exactly.
 */
export function lineText(tokens: readonly CodeToken[]): string {
  let text = "";

  for (const token of tokens) {
    text = text.padEnd(token.column, " ") + token.text;
  }

  return text;
}

/**
 * Each token of a line with the width of everything before it, which is where
 * it has to be drawn.
 */
export function placeTokens(
  tokens: readonly CodeToken[],
  advance: Advance,
): readonly PlacedToken[] {
  const text = lineText(tokens);

  return tokens.map((token) => ({
    token,
    x: advance(text.slice(0, token.column)),
  }));
}

/**
 * How far along a line a character column falls.
 *
 * A column past the end of the line is measured as though the line ran on in
 * spaces, so a mark naming more characters than the line holds still gets the
 * width it asked for rather than stopping at the last glyph.
 */
export function columnX(
  tokens: readonly CodeToken[],
  column: number,
  advance: Advance,
): number {
  return advance(lineText(tokens).padEnd(column, " ").slice(0, column));
}

/** Width of the ink on one line. */
export function lineWidth(
  tokens: readonly CodeToken[],
  advance: Advance,
): number {
  return advance(lineText(tokens));
}

/**
 * Width of the widest line, measured from the lines actually being drawn.
 * Narrower than the snippet's longest line whenever that line was dropped or
 * clipped, which keeps the panel hugged tight to what is visible.
 */
export function blockWidth(
  lines: readonly (readonly CodeToken[])[],
  advance: Advance,
): number {
  let width = 0;

  for (const tokens of lines) {
    width = Math.max(width, lineWidth(tokens, advance));
  }

  return width;
}
