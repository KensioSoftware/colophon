import { estimateCharsPerLine, wrapText } from "../../text/index.js";
import type { MetaImageProps } from "../../types.js";
import { optionalString } from "../props.js";

const maxTitleLines = 3;
const maxSubtitleLines = 3;

/**
 * One line of the card's centred text block.
 */
export interface CardLine {
  readonly text: string;
  readonly fontSize: number;
  readonly fontWeight: number;
  readonly opacity: number;
}

/**
 * The card's text block: the wrapped title, then the wrapped subtitle. No
 * gaps between the groups, because the card is the quieter layout and the
 * change of size and weight is enough to separate them.
 */
export function cardLines(
  props: MetaImageProps,
  contentWidth: number,
  titleFs: number,
  subFs: number,
): CardLine[] {
  const title = optionalString(props.title) ?? "";
  const subtitle = optionalString(props.subtitle);

  const titleLines = wrapText(
    title,
    estimateCharsPerLine(contentWidth, titleFs, 0.58),
  ).slice(0, maxTitleLines);

  const subtitleLines =
    subtitle === undefined || subtitle === ""
      ? []
      : wrapText(
          subtitle,
          estimateCharsPerLine(contentWidth, subFs, 0.52),
        ).slice(0, maxSubtitleLines);

  return [
    ...titleLines.map((text) => ({
      text,
      fontSize: titleFs,
      fontWeight: 800,
      opacity: 1,
    })),
    ...subtitleLines.map((text) => ({
      text,
      fontSize: subFs,
      fontWeight: 500,
      opacity: 0.85,
    })),
  ];
}
