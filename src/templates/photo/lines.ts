import type { TextLine } from "../../layout/index.js";
import { blockLines } from "../../layout/index.js";
import type { MeasureText, MetaImageProps } from "../../types.js";

const maxTitleLines = 3;
const maxStandfirstLines = 2;
const titleFloor = 0.6;
const standfirstFloor = 0.8;

/** The space the photo's text has, and how to measure it into it. */
export interface PhotoText {
  readonly measure: MeasureText;
  readonly fontFamily: string;
  readonly contentWidth: number;
  readonly titleFs: number;
  readonly standfirstFs: number;
  readonly height: number;
}

/**
 * The title, then the line under it.
 *
 * Both are shorter here than on the templates that have the whole image to
 * themselves. Text over a photograph is harder to read whatever the scrim
 * does, and a paragraph of it hides the picture that was the reason for
 * choosing this template.
 */
export function photoLines(props: MetaImageProps, text: PhotoText): TextLine[] {
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
      maxLines: maxStandfirstLines,
      fontSize: text.standfirstFs,
      floor: standfirstFloor,
      fontWeight: 500,
      opacity: 0.9,
      gapBefore: Math.round(text.height * 0.025),
    }),
  ];
}
