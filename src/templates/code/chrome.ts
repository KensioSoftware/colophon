import { drawLines } from "../../layout/index.js";
import type { Rect, TextLine } from "../../layout/index.js";
import type { Dimensions, ResolvedConfig } from "../../types.js";
import { footerBaseline, footerElement } from "../footer.js";
import { titleLineHeight } from "./lines.js";
import { imageMargin } from "./panel.js";

/**
 * The optional title, centred in the band reserved above the panel.
 *
 * The lines arrive already fitted, since the room the band has was measured
 * from them: whether the title wrapped is what decided how much of the image
 * the panel below it gets.
 */
export function codeHeading(
  lines: readonly TextLine[],
  band: Rect,
  config: ResolvedConfig,
): string {
  if (lines.length === 0) {
    return "";
  }

  return drawLines(lines, band, {
    fontFamily: config.fontFamily,
    fill: config.colors.foreground,
    lineHeight: titleLineHeight,
    anchor: "middle",
  });
}

/** The configured footer, centred along the bottom of the image. */
export function codeFooter(
  dimensions: Dimensions,
  fontSize: number,
  config: ResolvedConfig,
): string {
  const { width, height } = dimensions;

  return footerElement(config, {
    x: Math.round(width / 2),
    y: footerBaseline(height, imageMargin(dimensions), fontSize),
    fontSize,
    opacity: 0.78,
    anchor: "middle",
  });
}
