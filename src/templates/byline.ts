import { measureIn, textElement } from "../layout/index.js";
import type { ImageAsset, MeasureText } from "../types.js";
import type { PortraitPlacement } from "./portrait.js";
import { portraitImage, portraitRow } from "./portrait.js";

/** Unique within one image, which is as many bylines as a template draws. */
const avatarId = "colophon-byline";

/** How a byline is set, which is the part the footer takes from config. */
export interface BylineStyle {
  readonly fontFamily: string;
  readonly fontWeight: number;
  readonly fill: string;
}

/**
 * A line of the template's own words with the post's avatar before it: an
 * author and a date on an article, the person a quotation is from.
 *
 * This is `attribution` with the text opened up. The footer says who published
 * the site and is the same on every image; a byline says who wrote this one,
 * so it comes from the props. Both are a picture and a line of type on one
 * baseline, and both are drawn by {@link portraitRow}.
 */
export function byline(
  text: string,
  placement: PortraitPlacement,
  style: BylineStyle,
  avatar: ImageAsset | undefined,
  measure: MeasureText,
): string {
  if (text === "" && avatar === undefined) {
    return "";
  }

  const attributes = {
    fontFamily: style.fontFamily,
    fontSize: placement.fontSize,
    fontWeight: style.fontWeight,
    fill: style.fill,
    fillOpacity: placement.opacity,
  };

  if (avatar === undefined) {
    return textElement(text, {
      ...attributes,
      x: placement.x,
      y: placement.y,
      ...(placement.anchor !== undefined && { anchor: placement.anchor }),
    });
  }

  const width =
    text === ""
      ? 0
      : measureIn(
          measure,
          style.fontFamily,
          style.fontWeight,
        )(text, placement.fontSize);
  const { rect, labelX } = portraitRow(placement, width);

  return (
    portraitImage(avatar, rect, avatarId) +
    textElement(text, {
      ...attributes,
      x: labelX,
      y: placement.y,
      anchor: "start",
    })
  );
}
