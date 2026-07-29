import { drawLines } from "../../layout/index.js";
import type { Rect } from "../../layout/index.js";
import type { Dimensions, ResolvedConfig } from "../../types.js";
import { footerBaseline, footerElement } from "../footer.js";
import { imageMargin } from "./panel.js";

/**
 * The optional title, centred in the band reserved above the panel.
 *
 * It is drawn as a single line at the size the band was measured with, so a
 * title too long for the image runs over rather than wrapping into room that
 * was never set aside for it.
 */
export function codeHeading(
  title: string | undefined,
  band: Rect,
  fontSize: number,
  config: ResolvedConfig,
): string {
  if (title === undefined || title === "") {
    return "";
  }

  return drawLines(
    [{ text: title, fontSize, fontWeight: 700, opacity: 0.95 }],
    band,
    {
      fontFamily: config.fontFamily,
      fill: config.colors.foreground,
      lineHeight: 1,
      anchor: "middle",
    },
  );
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
