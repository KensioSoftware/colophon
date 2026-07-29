import type { MeasureText, MetaImageProps } from "../../types.js";
import type { TextLine } from "../../layout/index.js";
import { blockLines } from "../../layout/index.js";

const maxTitleLines = 3;
const maxSubtitleLines = 3;
const titleFloor = 0.62;
const subtitleFloor = 0.8;

/** The space the card's text has, and how to measure text into it. */
export interface CardText {
  readonly measure: MeasureText;
  readonly fontFamily: string;
  readonly contentWidth: number;
  readonly titleFs: number;
  readonly subFs: number;
}

/**
 * The card's text block: the wrapped title, then the wrapped subtitle. No
 * gaps between the groups, because the card is the quieter layout and the
 * change of size and weight is enough to separate them.
 */
export function cardLines(props: MetaImageProps, text: CardText): TextLine[] {
  const { measure, fontFamily, contentWidth } = text;

  return [
    ...blockLines(props.title, measure, fontFamily, {
      maxWidth: contentWidth,
      maxLines: maxTitleLines,
      fontSize: text.titleFs,
      floor: titleFloor,
      fontWeight: 800,
      opacity: 1,
    }),
    ...blockLines(props.subtitle, measure, fontFamily, {
      maxWidth: contentWidth,
      maxLines: maxSubtitleLines,
      fontSize: text.subFs,
      floor: subtitleFloor,
      fontWeight: 500,
      opacity: 0.85,
    }),
  ];
}
