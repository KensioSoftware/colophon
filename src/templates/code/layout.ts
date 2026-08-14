import type { CodeToken, HighlightedCode } from "../../highlight/index.js";
import type { ResolvedConfig } from "../../types.js";
import type { Advance } from "./advance.js";
import { cellWidth } from "./advance.js";
import { clipLines } from "./clip.js";
import { blockWidth } from "./extent.js";
import { fitFontSize, fitLines } from "./fit.js";
import type { Panel } from "./panel.js";

/**
 * A snippet sized to the space it has: the lines that survived, the grid they
 * are drawn on, and how many of them had to be clipped to get there.
 */
export interface FittedCode {
  readonly lines: readonly (readonly CodeToken[])[];
  readonly clipped: number;
  readonly fontSize: number;
  /** One cell of the monospace grid, in pixels, for the parts that are one. */
  readonly charWidth: number;
  readonly step: number;
  readonly padding: number;
}

/**
 * Fit a highlighted snippet into the panel it has been allotted: choose the
 * font size, then drop and clip whatever still does not fit.
 *
 * `gutter` is columns reserved to the left of the code, for line numbers. It
 * is counted in characters rather than pixels because that is what it is: the
 * numbers are digits in a monospace face, so the space they take follows
 * whatever font size the fitting settles on. Everything to the right of them
 * is measured instead, since the code is text and not necessarily a grid.
 */
export function fitSnippet(
  highlighted: HighlightedCode,
  available: Panel,
  imageWidth: number,
  config: ResolvedConfig,
  advance: Advance,
  gutter = 0,
): FittedCode {
  const inner = Math.round(Math.min(available.width, available.height) * 0.07);
  const codeWidth = Math.max(1, available.width - inner * 2);
  const codeHeight = Math.max(1, available.height - inner * 2);
  const cell = cellWidth(advance);

  const fontSize = fitFontSize(
    {
      lines: highlighted.lines.length,
      width: blockWidth(highlighted.lines, advance) + gutter * cell,
    },
    { width: codeWidth, height: codeHeight },
    imageWidth,
    config,
  );
  const step = fontSize * config.code.lineHeight;

  const { lines, clipped } = clipLines(
    fitLines(highlighted.lines, codeHeight, step),
    Math.max(cell, codeWidth / fontSize - gutter * cell),
    advance,
  );

  // Padding reads best proportional to the text rather than the panel, since a
  // snippet fitted down to a small size wants tighter margins. Only ever
  // shrink, so the code area the font was fitted against stays valid.
  const padding = Math.max(
    Math.min(inner, Math.round(fontSize * 1.6)),
    Math.round(inner * 0.35),
  );

  return {
    lines,
    clipped,
    fontSize,
    charWidth: fontSize * cell,
    step,
    padding,
  };
}
