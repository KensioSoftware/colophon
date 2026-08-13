import type { Rect } from "../layout/index.js";
import type { Dimensions, SafeArea } from "../types.js";

/** An image with none of it cropped away, which is what most of them are. */
const wholeImage: Required<SafeArea> = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

/**
 * One edge of a safe area, checked.
 *
 * The values are hand-written fractions and a percentage typed as one is the
 * slip to expect: `left: 25` insets a 1500px header by 37500px, which collapses
 * the content area to nothing and draws an image with no text on it. That is a
 * mistake nobody spots by looking at the output, since an empty banner looks
 * like a banner whose title the frontmatter forgot.
 */
function resolveEdge(value: number | undefined, edge: string): number {
  if (value === undefined) {
    return 0;
  }

  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new Error(
      `Invalid safeArea.${edge} ${String(value)}; expected a fraction of the` +
        ` image from 0 (no inset) up to but not including 1.`,
    );
  }

  return value;
}

/** Check that the two insets along one axis leave something between them. */
function assertAxis(start: number, end: number, edges: string): void {
  if (start + end >= 1) {
    throw new Error(
      `Invalid safeArea: ${edges} inset by ${String(start)} and ${String(end)}` +
        ` leave no room between them.`,
    );
  }
}

/**
 * A safe area with every edge filled in.
 *
 * Opposing edges are checked together as well as separately, since two
 * fractions that are each perfectly reasonable can still meet in the middle.
 */
export function resolveSafeArea(
  safeArea: SafeArea | undefined,
): Required<SafeArea> {
  if (safeArea === undefined) {
    return wholeImage;
  }

  const resolved = {
    top: resolveEdge(safeArea.top, "top"),
    right: resolveEdge(safeArea.right, "right"),
    bottom: resolveEdge(safeArea.bottom, "bottom"),
    left: resolveEdge(safeArea.left, "left"),
  };

  assertAxis(resolved.top, resolved.bottom, "top and bottom");
  assertAxis(resolved.left, resolved.right, "left and right");

  return resolved;
}

/**
 * The safe area as a rectangle of the image it applies to.
 *
 * Sides are fractions of the width and the top and bottom are fractions of the
 * height, so that one safe area describes the same crop whatever proportions
 * the image has. A safe area of nothing returns the whole image, which is what
 * makes this free to apply unconditionally.
 *
 * Both edges are rounded and the size taken from the difference, rather than
 * rounding the two insets and subtracting them. It is the same sum until an
 * inset lands on a half: YouTube's is `(1440 - 423) / 2`, so rounding the
 * insets sends 508.5 up at the top and again at the bottom and gives back a
 * band 422 tall where the platform published 423. Rounding a position is
 * asking where an edge goes, which is the question; rounding an inset twice
 * asks it once too often.
 */
export function safeRect(
  dimensions: Dimensions,
  safeArea: Required<SafeArea>,
): Rect {
  const { width, height } = dimensions;
  const x = Math.round(width * safeArea.left);
  const y = Math.round(height * safeArea.top);

  return {
    x,
    y,
    width: Math.round(width * (1 - safeArea.right)) - x,
    height: Math.round(height * (1 - safeArea.bottom)) - y,
  };
}
