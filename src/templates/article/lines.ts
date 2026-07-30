import type { TextLine } from "../../layout/index.js";
import { blockLines, optionalString } from "../../layout/index.js";
import type { MeasureText, MetaImageProps } from "../../types.js";

const maxTitleLines = 4;
const maxStandfirstLines = 3;
const titleFloor = 0.6;
const standfirstFloor = 0.8;

/** What goes between the author and the date. */
const separator = " · ";

/** The space the article's text has, and how to measure it into it. */
export interface ArticleText {
  readonly measure: MeasureText;
  readonly fontFamily: string;
  readonly contentWidth: number;
  readonly titleFs: number;
  readonly standfirstFs: number;
  readonly height: number;
}

/** The headline, then the standfirst under it. */
export function articleLines(
  props: MetaImageProps,
  text: ArticleText,
): TextLine[] {
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
      opacity: 0.85,
      gapBefore: Math.round(text.height * 0.03),
    }),
  ];
}

/**
 * The byline in the two forms it can take: who wrote it and when, then who
 * wrote it alone.
 *
 * The bottom line is shared with the site's own footer, so there is not always
 * room for both. Dropping the date is a better answer than cutting the line,
 * which on a square image lands in the middle of the month. Either may be
 * missing to begin with, and a post with neither leaves the avatar to stand
 * for both.
 */
export function bylineParts(props: MetaImageProps): readonly string[] {
  const author = optionalString(props["author"]) ?? "";
  const date = optionalString(props["date"]) ?? "";

  if (author === "" || date === "") {
    return [author === "" ? date : author].filter((part) => part !== "");
  }

  return [`${author}${separator}${date}`, author];
}

/** The byline as the post would have it, before any of it is given up. */
export function bylineText(props: MetaImageProps): string {
  return bylineParts(props)[0] ?? "";
}
