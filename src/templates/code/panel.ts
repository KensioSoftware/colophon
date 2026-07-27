import type { Dimensions, ResolvedConfig } from "../../types.js";

/**
 * The rounded plate the snippet is drawn on.
 */
export interface Panel {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
}

/**
 * Place the code panel within the image, leaving room above for a title and
 * below for a footer when either is present.
 */
export function layoutPanel(
  dimensions: Dimensions,
  config: ResolvedConfig,
  titleFontSize: number,
  footerFontSize: number,
  hasTitle: boolean,
  hasFooter: boolean,
): Panel {
  const { width, height } = dimensions;
  const shorter = Math.min(width, height);
  const pad = Math.round(shorter * 0.05);
  const gap = Math.round(shorter * 0.028);

  const top = pad + (hasTitle ? titleFontSize + gap : 0);
  const bottom = height - pad - (hasFooter ? footerFontSize + gap : 0);

  return {
    x: pad,
    y: top,
    width: width - pad * 2,
    height: Math.max(1, bottom - top),
    radius: Math.round(shorter * config.code.cornerScale),
  };
}
