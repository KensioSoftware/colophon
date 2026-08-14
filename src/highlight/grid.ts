import type { ThemedToken } from "shiki";

import { splitColor } from "./color.js";
import type { CodeToken } from "./types.js";

// Shiki's font-style bit flags (`FontStyle` in `@shikijs/types`).
const italicFlag = 1;
const boldFlag = 2;

/**
 * The runs one tokenised line becomes.
 *
 * Whitespace-only runs are dropped and each remaining run keeps the character
 * column it starts at, so the renderer can position every run absolutely
 * instead of relying on SVG text flow to preserve indentation.
 */
export function gridLine(tokens: readonly ThemedToken[]): CodeToken[] {
  let column = 0;
  const line: CodeToken[] = [];

  for (const token of tokens) {
    const start = column;
    column += token.content.length;

    const leading = token.content.length - token.content.trimStart().length;
    const text = token.content.trim();

    if (text === "") {
      continue;
    }

    const { color, opacity } = splitColor(token.color);
    const fontStyle = token.fontStyle ?? 0;

    line.push({
      text,
      column: start + leading,
      color,
      opacity,
      bold: (fontStyle & boldFlag) !== 0,
      italic: (fontStyle & italicFlag) !== 0,
    });
  }

  return line;
}
