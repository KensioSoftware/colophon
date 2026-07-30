import type { TextLine } from "../../layout/index.js";
import { blockLines } from "../../layout/index.js";
import type { MeasureText, MetaImageProps } from "../../types.js";

const maxTitleLines = 3;
const maxSummaryLines = 3;
const titleFloor = 0.62;
const summaryFloor = 0.8;

/** The space the page's text has, and how to measure it into it. */
export interface DocsText {
  readonly measure: MeasureText;
  readonly fontFamily: string;
  readonly contentWidth: number;
  readonly titleFs: number;
  readonly summaryFs: number;
  readonly height: number;
}

/** The page title, then the summary under it. */
export function docsLines(props: MetaImageProps, text: DocsText): TextLine[] {
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
      maxLines: maxSummaryLines,
      fontSize: text.summaryFs,
      floor: summaryFloor,
      fontWeight: 500,
      opacity: 0.85,
      gapBefore: Math.round(text.height * 0.035),
    }),
  ];
}
