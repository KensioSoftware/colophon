import { textElement } from "../../layout/index.js";
import type { Dimensions, ResolvedConfig } from "../../types.js";
import { footerElement } from "../footer.js";
import type { Panel } from "./panel.js";

/**
 * The optional title, centred just above the panel.
 */
export function codeHeading(
  title: string | undefined,
  panel: Panel,
  fontSize: number,
  imageWidth: number,
  config: ResolvedConfig,
): string {
  if (title === undefined || title === "") {
    return "";
  }

  return textElement(title, {
    x: Math.round(imageWidth / 2),
    y: panel.y - Math.round(fontSize * 0.42),
    fontFamily: config.fontFamily,
    fontSize,
    fontWeight: 700,
    fill: config.colors.foreground,
    fillOpacity: 0.95,
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
    y: height - Math.round(Math.min(width, height) * 0.05),
    fontSize,
    opacity: 0.78,
    anchor: "middle",
  });
}
