import { clampLine, measureIn } from "../../layout/index.js";
import type { MeasureAt } from "../../layout/index.js";
import type { ImageAsset, MeasureText, ResolvedConfig } from "../../types.js";
import { byline } from "../byline.js";
import { footerElement, hasFooter } from "../footer.js";
import type { Frame } from "../frame.js";
import { portraitAdvance } from "../portrait.js";

/** Clear space between the byline and the footer at the other end. */
const gapScale = 1.2;

/**
 * The longest form of the byline that fits the room it has, cut only when even
 * the shortest of them does not.
 */
function fitByline(
  parts: readonly string[],
  room: number,
  measure: MeasureAt,
  fontSize: number,
): string {
  for (const part of parts) {
    if (measure(part, fontSize) <= room) {
      return part;
    }
  }

  return clampLine(parts.at(-1) ?? "", room, measure, fontSize);
}

/**
 * The bottom line: who wrote the post at the left, whose site it is at the
 * right.
 *
 * The two are measured against each other rather than drawn and hoped for. A
 * byline is a person's name and a date, a footer is a domain, and both are as
 * long as they are, so on a landscape image they meet in the middle and
 * overlap. The site's footer keeps its room, since it is the same on every
 * image and a build can be sure it fits, and the byline takes what is left and
 * is cut to it.
 */
export function articleBottom(
  said: readonly string[],
  config: ResolvedConfig,
  frame: Frame,
  imageWidth: number,
  avatar: ImageAsset | undefined,
  measure: MeasureText,
): string {
  const { pad, footerFontSize: fontSize } = frame;
  const footer = hasFooter(config) ? (config.footer ?? "") : "";
  const footerWidth =
    footer === ""
      ? 0
      : measureIn(measure, config.fontFamily, 500)(footer, fontSize) +
        fontSize * gapScale;

  const room =
    imageWidth -
    pad * 2 -
    Math.round(footerWidth) -
    (avatar === undefined ? 0 : portraitAdvance(fontSize));

  return (
    byline(
      fitByline(
        said,
        room,
        measureIn(measure, config.fontFamily, 600),
        fontSize,
      ),
      {
        x: pad,
        y: frame.footerY,
        fontSize,
        opacity: 0.9,
        left: pad,
        width: imageWidth - pad * 2,
      },
      {
        fontFamily: config.fontFamily,
        fontWeight: 600,
        fill: config.colors.foreground,
      },
      avatar,
      measure,
    ) +
    footerElement(config, {
      x: imageWidth - pad,
      y: frame.footerY,
      fontSize,
      opacity: 0.7,
      anchor: "end",
    })
  );
}
