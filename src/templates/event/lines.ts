import type { TextLine } from "../../layout/index.js";
import { blockLines } from "../../layout/index.js";
import type { MeasureText, MetaImageProps } from "../../types.js";

const maxTitleLines = 3;
const maxLocationLines = 2;
const titleFloor = 0.6;
const locationFloor = 0.8;

/** The space the event's text has, and how to measure it into it. */
export interface EventText {
  readonly measure: MeasureText;
  readonly fontFamily: string;
  readonly contentWidth: number;
  readonly titleFs: number;
  readonly locationFs: number;
  readonly height: number;
}

/** What the event is, then where it is. */
export function eventLines(props: MetaImageProps, text: EventText): TextLine[] {
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
    ...blockLines(props["location"], measure, fontFamily, {
      maxWidth: contentWidth,
      maxLines: maxLocationLines,
      fontSize: text.locationFs,
      floor: locationFloor,
      fontWeight: 500,
      opacity: 0.85,
      gapBefore: Math.round(text.height * 0.035),
    }),
  ];
}
