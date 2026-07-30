import { image, row } from "../layout/index.js";
import type { Rect } from "../layout/index.js";
import type { ImageAsset } from "../types.js";
import type { FooterPlacement } from "./footer.js";

/** The avatar's diameter, as a multiple of the line's font size. */
const avatarScale = 1.9;

/** Where a circular avatar's centre sits above the line's baseline. */
const avatarRise = 0.34;

/** Space between the picture and the words, as a multiple of the size. */
const gapScale = 0.5;

/**
 * How much of the line the picture takes before the words start.
 *
 * A template with something else on the same line, such as the article's
 * footer at the other end of it, has to know this before it can work out what
 * room the words are left with.
 */
export function portraitAdvance(fontSize: number): number {
  return portraitHeight(fontSize) + Math.round(fontSize * gapScale);
}

/**
 * How tall a line with a picture on it is, which is more than the words alone
 * would need. A template stacking such a line with anything else has to leave
 * room for the picture or the two collide.
 */
export function portraitHeight(fontSize: number): number {
  return Math.round(fontSize * avatarScale);
}

/** A line with an avatar on it: the space it has, and where the line sits. */
export interface PortraitPlacement extends FooterPlacement {
  /** Left edge and width of the content area the line is set within. */
  readonly left: number;
  readonly width: number;
}

/** Where the picture and the words beside it ended up. */
export interface Portrait {
  readonly rect: Rect;
  /** Where the label starts, which is after the picture and its gap. */
  readonly labelX: number;
}

/**
 * Set a circular avatar and a label beside it on one line.
 *
 * Only the horizontal placement comes from the row. The baseline is the one
 * the template asked for, so a line with an avatar and a line without one sit
 * at the same height.
 */
export function portraitRow(
  placement: PortraitPlacement,
  textWidth: number,
): Portrait {
  const { fontSize } = placement;
  const size = Math.round(fontSize * avatarScale);
  const gap = textWidth === 0 ? 0 : Math.round(fontSize * gapScale);

  const [portrait, label] = row(
    [{ size }, { size: Math.round(textWidth), gapBefore: gap }],
    { x: placement.left, y: placement.y, width: placement.width, height: size },
    placement.anchor === "middle" ? "centre" : "start",
  );

  return {
    rect: {
      x: portrait?.x ?? placement.left,
      y: Math.round(placement.y - fontSize * avatarRise - size / 2),
      width: size,
      height: size,
    },
    labelX: label?.x ?? placement.left,
  };
}

/** The avatar itself, clipped to a circle. */
export function portraitImage(
  avatar: ImageAsset,
  rect: Rect,
  id: string,
): string {
  return image(rect, avatar.href, {
    fit: "cover",
    radius: Math.round(rect.width / 2),
    id,
  });
}
