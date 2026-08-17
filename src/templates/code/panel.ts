import type { Rect } from "../../layout/index.js";
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

/** Margin from the image edge to anything drawn inside it. */
export function imageMargin(dimensions: Dimensions): number {
  return Math.round(Math.min(dimensions.width, dimensions.height) * 0.05);
}

/**
 * Clear space between the panel and the title above it or the footer below.
 *
 * `layoutPanel` reserves this at each end alongside the room the text takes,
 * and the bands those lines are then placed in take the room and leave the gap.
 * The two agree because both are measured from here, which is the whole point:
 * a gap that is reserved in one place and drawn in another drifts.
 */
function gapAround(dimensions: Dimensions): number {
  return Math.round(Math.min(dimensions.width, dimensions.height) * 0.028);
}

/**
 * Place the code panel within the image, leaving room above for a title and
 * below for a footer when either is present.
 *
 * The title's room is passed in already measured rather than worked out from a
 * font size here, because how much room it wants depends on how many lines it
 * wrapped to. A title of no room at all is one there is nothing to reserve for.
 */
export function layoutPanel(
  dimensions: Dimensions,
  config: ResolvedConfig,
  titleRoom: number,
  footerFontSize: number,
  hasFooter: boolean,
): Panel {
  const { width, height } = dimensions;
  const shorter = Math.min(width, height);
  const pad = imageMargin(dimensions);
  const gap = gapAround(dimensions);

  const top = pad + (titleRoom > 0 ? titleRoom + gap : 0);
  const bottom = height - pad - (hasFooter ? footerFontSize + gap : 0);

  return {
    x: pad,
    y: top,
    width: width - pad * 2,
    height: Math.max(1, bottom - top),
    radius: Math.round(shorter * config.code.cornerScale),
  };
}

/**
 * The band the title was given: the room reserved for its lines above the
 * panel, with the reserved gap between the two.
 *
 * It is measured up from the panel rather than down from the top margin, so
 * that it follows the panel when the panel hugs a short snippet and moves
 * down. That keeps the title with the plate it names rather than stranding it
 * at the top of the image.
 */
export function titleBand(
  panel: Panel,
  dimensions: Dimensions,
  titleRoom: number,
): Rect {
  return {
    x: 0,
    y: panel.y - gapAround(dimensions) - titleRoom,
    width: dimensions.width,
    height: titleRoom,
  };
}
