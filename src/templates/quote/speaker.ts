import { baselineFor } from "../../layout/index.js";
import type { Rect } from "../../layout/index.js";
import type { ImageAsset, MeasureText, ResolvedConfig } from "../../types.js";
import { byline } from "../byline.js";
import { portraitHeight } from "../portrait.js";

/**
 * The room the attribution line needs.
 *
 * A picture is taller than the words beside it, so a line carrying one takes
 * its height rather than the type's. A quotation with neither takes nothing,
 * and the words move down into the space.
 */
export function speakerRoom(
  said: string,
  fontSize: number,
  avatar: ImageAsset | undefined,
): number {
  if (avatar !== undefined) {
    return portraitHeight(fontSize);
  }

  return said === "" ? 0 : fontSize;
}

/**
 * Who said it, centred under the quotation with the avatar before them.
 *
 * The line is centred within the slot rather than set from its top, since the
 * slot is as tall as the picture and the words are not.
 */
export function speaker(
  said: string,
  slot: Rect | undefined,
  fontSize: number,
  config: ResolvedConfig,
  avatar: ImageAsset | undefined,
  measure: MeasureText,
): string {
  if (slot === undefined) {
    return "";
  }

  return byline(
    said,
    {
      x: Math.round(slot.x + slot.width / 2),
      y: baselineFor(slot.y + (slot.height - fontSize) / 2, fontSize),
      fontSize,
      opacity: 0.85,
      anchor: "middle",
      left: slot.x,
      width: slot.width,
    },
    {
      fontFamily: config.fontFamily,
      fontWeight: 600,
      fill: config.colors.foreground,
    },
    avatar,
    measure,
  );
}
