import type { TextLine } from "../../layout/index.js";
import { blockLines, clampLine, measureIn } from "../../layout/index.js";
import type { MeasureText, MetaImageProps } from "../../types.js";

/**
 * One line for the name, for the reason the `wordmark` has one: a name broken
 * across two lines stops reading as a name. On a strip it is also the only
 * arrangement that fits, since a second line of a title set to fill the band
 * would be a second band.
 */
const maxNameLines = 1;

const maxTaglineLines = 2;

/** The weights the two blocks are drawn at, and so measured at. */
const nameWeight = 800;
const taglineWeight = 500;

const nameFloor = 0.5;
const taglineFloor = 0.7;

/**
 * The name's size, as a fraction of the room it has. It gives up a third of
 * that where there is a tagline under it, which is what leaves the two
 * reading as a pair rather than as one line with a caption squeezed beneath.
 */
const nameScale = 0.48;
const nameWithTaglineScale = 0.3;

/** The tagline's size, and the clear space above it, both of the same room. */
const taglineScale = 0.15;
const taglineGapScale = 0.09;

/** The space the cover's text has, and how to measure it into it. */
export interface CoverText {
  readonly measure: MeasureText;
  readonly fontFamily: string;
  readonly contentWidth: number;
  /**
   * The height the text is sized against, which is the content area's rather
   * than the image's.
   *
   * Every other template takes its sizes from the image, and on a cover that
   * is the wrong number by a wide margin: a YouTube banner is 1440 tall and
   * the band anyone reads is 423 of it, so a title at a tenth of the image
   * would be a third of the height of the part that is seen.
   */
  readonly contentHeight: number;
}

/**
 * The name as one line: shrunk until it fits, and cut with an ellipsis where
 * even the floor is not small enough.
 *
 * Wrapping is what the fitting does at that point, and on a strip there is no
 * second line to wrap onto. This is `wordmark`'s treatment of the same string,
 * and it is here rather than shared because the two differ in the fitting
 * around it rather than in this.
 */
function nameLines(
  props: MetaImageProps,
  text: CoverText,
  fontSize: number,
): TextLine[] {
  const { measure, fontFamily, contentWidth } = text;
  const name = props.title;
  const [line] = blockLines(name, measure, fontFamily, {
    maxWidth: contentWidth,
    maxLines: maxNameLines,
    fontSize,
    floor: nameFloor,
    fontWeight: nameWeight,
    opacity: 1,
  });

  if (line === undefined || line.text === name) {
    return line === undefined ? [] : [line];
  }

  return [
    {
      ...line,
      text: clampLine(
        line.text,
        contentWidth,
        measureIn(measure, fontFamily, nameWeight),
        line.fontSize,
      ),
    },
  ];
}

/** The name over its tagline, each fitted to the room the lockup has. */
export function coverLines(props: MetaImageProps, text: CoverText): TextLine[] {
  const { measure, fontFamily, contentWidth, contentHeight } = text;
  const tagline = blockLines(props.subtitle, measure, fontFamily, {
    maxWidth: contentWidth,
    maxLines: maxTaglineLines,
    fontSize: Math.round(contentHeight * taglineScale),
    floor: taglineFloor,
    fontWeight: taglineWeight,
    opacity: 0.85,
    gapBefore: Math.round(contentHeight * taglineGapScale),
  });

  const scale = tagline.length === 0 ? nameScale : nameWithTaglineScale;

  return [
    ...nameLines(props, text, Math.round(contentHeight * scale)),
    ...tagline,
  ];
}
