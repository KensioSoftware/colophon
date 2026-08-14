import type { CodeToken } from "../../highlight/index.js";
import type { Dimensions, ResolvedConfig } from "../../types.js";
import { ellipsis } from "../../text/ellipsis.js";

/**
 * How much room a snippet wants: how many lines it has, and how wide the
 * widest of them is as a multiple of the font size.
 */
export interface SnippetExtent {
  readonly lines: number;
  readonly width: number;
}

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
  extent: SnippetExtent,
  area: Dimensions,
  imageWidth: number,
  config: ResolvedConfig,
): number {
  const { lineHeight, maxFontScale, minFontScale } = config.code;

  // A snippet with nothing in it puts no bound on the width, and the clamp
  // below is what then decides the size.
  const byWidth = extent.width > 0 ? area.width / extent.width : Infinity;
  const byHeight = area.height / (Math.max(1, extent.lines) * lineHeight);

  const fitted = Math.min(byWidth, byHeight, imageWidth * maxFontScale);
  return Math.max(1, Math.floor(Math.max(fitted, imageWidth * minFontScale)));
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
