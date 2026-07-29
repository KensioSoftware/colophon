import { image, measureIn, row } from "../layout/index.js";
import type { ImageAsset, MeasureText, ResolvedConfig } from "../types.js";
import type { FooterPlacement } from "./footer.js";
import { footerElement, hasFooter } from "./footer.js";

/** The avatar's diameter, as a multiple of the footer's font size. */
const avatarScale = 1.9;

/** Where a circular avatar's centre sits above the footer's baseline. */
const avatarRise = 0.34;

/** Unique within one image, which is as many avatars as there are. */
const avatarId = "colophon-avatar";

/** Where the attribution line goes: a footer placement, plus room to lay it out. */
export interface AttributionPlacement extends FooterPlacement {
  /** Left edge and width of the content area the line is set within. */
  readonly left: number;
  readonly width: number;
}

/**
 * The footer line, with the post's avatar before it.
 *
 * Both belong to the same idea, which is who made this, so they are drawn as
 * one line rather than tucked into separate corners. Without an avatar this is
 * the footer exactly as it was, down to the byte.
 */
export function attribution(
  config: ResolvedConfig,
  placement: AttributionPlacement,
  avatar: ImageAsset | undefined,
  measure: MeasureText,
): string {
  if (avatar === undefined) {
    return footerElement(config, placement);
  }

  const { fontSize } = placement;
  const size = Math.round(fontSize * avatarScale);
  const text = hasFooter(config) ? (config.footer ?? "") : "";
  const gap = text === "" ? 0 : Math.round(fontSize * 0.5);
  const textWidth =
    text === ""
      ? 0
      : measureIn(measure, config.fontFamily, 500)(text, fontSize);

  // Only the horizontal placement comes from the row. The baseline is the one
  // the template asked for, so a footer with no avatar and a footer with one
  // sit at the same height.
  const [portrait, label] = row(
    [{ size }, { size: Math.round(textWidth), gapBefore: gap }],
    { x: placement.left, y: placement.y, width: placement.width, height: size },
    placement.anchor === "middle" ? "centre" : "start",
  );

  const top = Math.round(placement.y - fontSize * avatarRise - size / 2);

  return (
    image(
      { x: portrait?.x ?? placement.left, y: top, width: size, height: size },
      avatar.href,
      { fit: "cover", radius: Math.round(size / 2), id: avatarId },
    ) +
    footerElement(config, {
      ...placement,
      x: label?.x ?? placement.left,
      anchor: "start",
    })
  );
}
