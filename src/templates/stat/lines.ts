import type { TextLine } from "../../layout/index.js";
import { blockLines } from "../../layout/index.js";
import type { MeasureText, MetaImageProps } from "../../types.js";

const maxLabelLines = 1;
const maxCaptionLines = 3;
const figureFloor = 0.35;
const labelFloor = 0.7;
const captionFloor = 0.8;

/** The space the stat's three groups have, and how to measure text into them. */
export interface StatText {
  readonly measure: MeasureText;
  readonly fontFamily: string;
  readonly contentWidth: number;
  readonly labelFs: number;
  readonly figureFs: number;
  readonly captionFs: number;
  readonly height: number;
}

/**
 * The stat's text block: a label, the figure itself, then the caption under it.
 *
 * The figure has much further to shrink than anything else in the built-ins,
 * because it is one line that must not wrap and the props decide how long it
 * is: `42` and `1.4 million downloads` are both stats somebody will write.
 * Shrinking is the only way both end up inside the margins, and the floor is
 * low enough that the second still reads as the headline of the image.
 */
export function statLines(props: MetaImageProps, text: StatText): TextLine[] {
  const { measure, fontFamily, contentWidth } = text;

  return [
    ...blockLines(props.title, measure, fontFamily, {
      maxWidth: contentWidth,
      maxLines: maxLabelLines,
      fontSize: text.labelFs,
      floor: labelFloor,
      fontWeight: 600,
      opacity: 0.75,
    }),
    ...blockLines(props["stat"], measure, fontFamily, {
      maxWidth: contentWidth,
      maxLines: 1,
      fontSize: text.figureFs,
      floor: figureFloor,
      fontWeight: 800,
      opacity: 1,
      gapBefore: Math.round(text.height * 0.02),
    }),
    ...blockLines(props.subtitle, measure, fontFamily, {
      maxWidth: contentWidth,
      maxLines: maxCaptionLines,
      fontSize: text.captionFs,
      floor: captionFloor,
      fontWeight: 500,
      opacity: 0.85,
      gapBefore: Math.round(text.height * 0.018),
    }),
  ];
}
