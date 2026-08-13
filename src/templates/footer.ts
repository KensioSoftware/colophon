import { baselineFor, textElement } from "../layout/index.js";
import type { Dimensions, ResolvedConfig } from "../types.js";

/** The footer's size, as a fraction of the image's height. */
const footerScale = 0.036;

/**
 * The least it may be, as a fraction of the image's width.
 *
 * Height alone is what the footer used to be measured against, and it left the
 * landscape sizes with the smallest text on the least of it: at 1200x630 the
 * line came out at 20px against the square's 38px, on an image a feed scales
 * to the same width. Width is what legibility tracks, for the reason the code
 * template's font-size bounds are fractions of it, so this is the floor that
 * stops a wide image having a footer nobody can read. The square is above it
 * and keeps the proportions it had.
 */
const footerWidthFloor = 0.026;

/**
 * The size the line along the bottom is drawn at.
 *
 * Every template asks for it here rather than working it out, which is what
 * stops the twelve of them drifting apart. It is one number for the footer,
 * the byline and the attribution alike, since they are all the same line.
 */
export function footerFontSize(dimensions: Dimensions): number {
  return Math.round(
    Math.max(
      dimensions.height * footerScale,
      dimensions.width * footerWidthFloor,
    ),
  );
}

/**
 * Where and how a template wants its footer drawn. Every template places the
 * footer differently; what they share is that a config with no footer, or an
 * empty one, draws nothing at all.
 */
export interface FooterPlacement {
  readonly x: number;
  readonly y: number;
  readonly fontSize: number;
  readonly opacity: number;
  readonly anchor?: "start" | "middle" | "end";
}

/**
 * The baseline of a footer sitting on the bottom margin.
 *
 * The margin is where the line's ink stops rather than where its baseline
 * goes, so the last line of an image keeps the same clear space below it as
 * the content beside it has either side, and the descenders stay inside it.
 */
export function footerBaseline(
  height: number,
  pad: number,
  fontSize: number,
): number {
  return baselineFor(height - pad - fontSize, fontSize);
}

/** Whether the config carries a footer worth drawing. */
export function hasFooter(config: ResolvedConfig): boolean {
  return config.footer !== undefined && config.footer !== "";
}

/**
 * The configured footer as a `<text>` element, or an empty string when there
 * is none. Templates call this unconditionally and let it decide.
 */
export function footerElement(
  config: ResolvedConfig,
  placement: FooterPlacement,
): string {
  if (!hasFooter(config)) {
    return "";
  }

  return textElement(config.footer ?? "", {
    x: placement.x,
    y: placement.y,
    fontFamily: config.fontFamily,
    fontSize: placement.fontSize,
    fontWeight: 500,
    fill: config.colors.foreground,
    fillOpacity: placement.opacity,
    ...(placement.anchor !== undefined && { anchor: placement.anchor }),
  });
}
