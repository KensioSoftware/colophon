import type { CodeToken, HighlightedCode } from "../../highlight/index.js";
import type { ResolvedConfig } from "../../types.js";
import { ellipsis } from "./ellipsis.js";

/**
 * Pick the largest font size that fits the snippet in the panel on both axes,
 * clamped to the configured bounds.
 *
 * The bounds are fractions of the image *width*, not its height: a share image
 * is scaled to fit the width of whatever feed shows it, so width is what
 * decides whether the code ends up legible. Keying the floor to height would
 * let a landscape image render the same snippet at half the size of its square
 * counterpart.
 */
export function fitFontSize(
  highlighted: HighlightedCode,
  codeWidth: number,
  codeHeight: number,
  imageWidth: number,
  config: ResolvedConfig,
): number {
  const { charWidthRatio, lineHeight, maxFontScale, minFontScale } =
    config.code;

  const byWidth =
    codeWidth / (Math.max(1, highlighted.longestLine) * charWidthRatio);
  const byHeight =
    codeHeight / (Math.max(1, highlighted.lines.length) * lineHeight);

  const fitted = Math.min(byWidth, byHeight, imageWidth * maxFontScale);
  return Math.max(1, Math.floor(Math.max(fitted, imageWidth * minFontScale)));
}

/**
 * Width of the laid-out block in characters, measured from the lines actually
 * being drawn. Narrower than the snippet's longest line whenever that line was
 * dropped or clipped, which keeps the panel hugged tight to what is visible.
 */
export function blockColumns(lines: readonly (readonly CodeToken[])[]): number {
  let columns = 0;

  for (const tokens of lines) {
    const last = tokens.at(-1);

    if (last !== undefined) {
      columns = Math.max(columns, last.column + last.text.length);
    }
  }

  return columns;
}

function ellipsisToken(column: number): CodeToken {
  return {
    text: ellipsis,
    column,
    color: undefined,
    opacity: 0.6,
    bold: false,
    italic: false,
  };
}

/**
 * Drop lines that cannot fit at the chosen font size, marking the truncation
 * with an ellipsis line so the image never silently misrepresents the snippet.
 * The marker takes the indentation of the first dropped line, so it reads as
 * part of the block rather than as a stray mark in the left margin.
 */
export function fitLines(
  lines: readonly (readonly CodeToken[])[],
  codeHeight: number,
  step: number,
): readonly (readonly CodeToken[])[] {
  const maxLines = Math.max(1, Math.floor(codeHeight / step));

  if (lines.length <= maxLines) {
    return lines;
  }

  const kept = lines.slice(0, maxLines - 1);
  const dropped = lines.slice(maxLines - 1).find((line) => line.length > 0);

  return [...kept, [ellipsisToken(dropped?.[0]?.column ?? 0)]];
}
