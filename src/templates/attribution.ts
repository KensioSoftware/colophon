import { measureIn } from "../layout/index.js";
import type { ImageAsset, MeasureText, ResolvedConfig } from "../types.js";
import { footerElement, hasFooter } from "./footer.js";
import type { PortraitPlacement } from "./portrait.js";
import { portraitImage, portraitRow } from "./portrait.js";

/** Unique within one image, which is as many footer avatars as there are. */
const avatarId = "colophon-avatar";

/** Where the attribution line goes: a footer placement, plus room to lay it out. */
export type AttributionPlacement = PortraitPlacement;

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

  const text = hasFooter(config) ? (config.footer ?? "") : "";
  const width =
    text === ""
      ? 0
      : measureIn(measure, config.fontFamily, 500)(text, placement.fontSize);
  const { rect, labelX } = portraitRow(placement, width);

  return (
    portraitImage(avatar, rect, avatarId) +
    footerElement(config, { ...placement, x: labelX, anchor: "start" })
  );
}
