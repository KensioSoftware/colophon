import type { TextLine } from "../../layout/index.js";
import { blockLines, fillLines, linesHeight } from "../../layout/index.js";
import type { MeasureText, MetaImageProps } from "../../types.js";

/** How tightly the title's own lines are stacked. */
export const titleLineHeight = 1.08;

/** And the subtitle's, which is set at a readable size rather than a large one. */
export const subtitleLineHeight = 1.25;

const maxSubtitleLines = 2;
const subtitleFloor = 0.8;

/**
 * The title's ceiling, as a fraction of the image's height.
 *
 * Nothing longer than a word or two ever reaches it, since the width runs out
 * first: at 16:9 a two-word title settles around 0.45 of the height on its own.
 * What the ceiling is for is the one-word case, where the width would allow
 * something enormous, and half the height is where a single word stops reading
 * as writing and starts reading as a graphic.
 */
const maxTitleScale = 0.5;

/**
 * And its floor, below which the title is cut instead.
 *
 * Around 90px at 720 tall. A thumbnail is shown at something like a third of
 * the width it was rendered at, so this is roughly the smallest text a reader
 * scrolling past can still take in, and a title that will not fit at it is one
 * with too much in it for the format.
 */
const minTitleScale = 0.125;

/** The subtitle's size, which does not change with how long the title is. */
const subtitleScale = 0.055;

/** The space the thumbnail's text has, and how to measure text into it. */
export interface ThumbnailText {
  readonly measure: MeasureText;
  readonly fontFamily: string;
  readonly contentWidth: number;
  readonly contentHeight: number;
  readonly height: number;
}

/** The gap between the title and the subtitle under it. */
export function subtitleGap(height: number): number {
  return Math.round(height * 0.035);
}

/**
 * The optional second line: a series name, a channel, the episode number.
 *
 * It is fitted first because the title takes whatever height it leaves, which
 * is the order this layout is built in: the title is the picture, and what is
 * under it is a caption on it.
 */
export function thumbnailSubtitle(
  props: MetaImageProps,
  text: ThumbnailText,
): TextLine[] {
  return blockLines(props.subtitle, text.measure, text.fontFamily, {
    maxWidth: text.contentWidth,
    maxLines: maxSubtitleLines,
    fontSize: Math.round(text.height * subtitleScale),
    floor: subtitleFloor,
    fontWeight: 600,
    opacity: 0.85,
  });
}

/**
 * The title, grown until it fills the room the subtitle left it.
 *
 * This is the one built-in whose text is sized by the box rather than by the
 * image, and the format is the reason. Everything else here is drawn to be read
 * at something near the size it was rendered at, where a heading that swelled
 * to fill its space would stop looking like a heading. A video thumbnail is
 * seen in a list at a fraction of that size, so the only thing on it that
 * matters is that the words are as large as they can be.
 */
export function thumbnailTitle(
  props: MetaImageProps,
  text: ThumbnailText,
  subtitleRoom: number,
): TextLine[] {
  return fillLines(props.title, text.measure, text.fontFamily, {
    maxWidth: text.contentWidth,
    maxHeight: Math.max(1, text.contentHeight - subtitleRoom),
    lineHeight: titleLineHeight,
    maxFontSize: Math.round(text.height * maxTitleScale),
    minFontSize: Math.round(text.height * minTitleScale),
    fontWeight: 800,
    opacity: 1,
  });
}

/** The room the subtitle takes, including the gap above it, or none at all. */
export function subtitleRoom(
  lines: readonly TextLine[],
  height: number,
): number {
  const stacked = linesHeight(lines, subtitleLineHeight);

  return stacked === 0 ? 0 : stacked + subtitleGap(height);
}
