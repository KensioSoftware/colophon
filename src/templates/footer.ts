import { baselineFor, textElement } from "../layout/index.js";
import type { ResolvedConfig } from "../types.js";

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
