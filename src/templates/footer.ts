import { textElement } from "../text/index.js";
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
