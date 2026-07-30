import { image } from "../../layout/index.js";
import type { Rect } from "../../layout/index.js";
import type { ImageAsset } from "../../types.js";

/** The mark's height, as a fraction of the image's. */
const markScale = 0.2;

/**
 * How tall the mark is drawn, or nothing at all where the project configured
 * no logo, which is what takes the mark and the gap under it out of the stack.
 */
export function markHeight(
  logo: ImageAsset | undefined,
  imageHeight: number,
): number {
  return logo === undefined ? 0 : Math.round(imageHeight * markScale);
}

/**
 * The mark, centred in the slot the stack gave it.
 *
 * Its width comes from the height it was allotted and the proportions of the
 * file, as it does in the corner of every other template, so one logo works on
 * a square and a landscape alike.
 */
export function markElement(
  logo: ImageAsset | undefined,
  slot: Rect | undefined,
): string {
  if (logo === undefined || slot === undefined || slot.height === 0) {
    return "";
  }

  const width = Math.round(slot.height * logo.aspect);

  return image(
    {
      x: Math.round(slot.x + (slot.width - width) / 2),
      y: slot.y,
      width,
      height: slot.height,
    },
    logo.href,
    { fit: "contain" },
  );
}
