import type { TextLine } from "../../layout/index.js";
import {
  blockLines,
  clampLine,
  measureIn,
  optionalString,
} from "../../layout/index.js";
import type { MeasureText, MetaImageProps } from "../../types.js";

const maxNameLines = 1;
const maxTaglineLines = 2;

/** The weight the name is both drawn at and measured at, which have to agree. */
const nameWeight = 800;

const nameFloor = 0.45;
const taglineFloor = 0.8;

/** The space the wordmark's text has, and how to measure it into it. */
export interface WordmarkText {
  readonly measure: MeasureText;
  readonly fontFamily: string;
  readonly contentWidth: number;
  readonly nameFs: number;
  readonly taglineFs: number;
  readonly height: number;
}

/**
 * The name as one line: shrunk until it fits, and cut with an ellipsis when
 * even the floor is not small enough.
 *
 * Wrapping is what the fitting would otherwise do at that point, and a name
 * with no spaces in it wraps mid-word. A cut says the name goes on; a name
 * broken across two lines looks like the name.
 */
function nameLines(props: MetaImageProps, text: WordmarkText): TextLine[] {
  const { measure, fontFamily, contentWidth } = text;
  const name = optionalString(props.title) ?? "";
  const [line] = blockLines(name, measure, fontFamily, {
    maxWidth: contentWidth,
    maxLines: maxNameLines,
    fontSize: text.nameFs,
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
        name,
        contentWidth,
        measureIn(measure, fontFamily, nameWeight),
        line.fontSize,
      ),
    },
  ];
}

/**
 * The name, then the tagline under it.
 *
 * The name is one line however small that has to make it, because a product
 * name broken across two stops looking like a wordmark. A scoped package name,
 * which is the case this template exists for, is exactly the string that would
 * otherwise be broken up: it is one long word, so wrapping it splits it
 * mid-word rather than at the slash.
 */
export function wordmarkLines(
  props: MetaImageProps,
  text: WordmarkText,
): TextLine[] {
  const { measure, fontFamily, contentWidth } = text;

  return [
    ...nameLines(props, text),
    ...blockLines(props.subtitle, measure, fontFamily, {
      maxWidth: contentWidth,
      maxLines: maxTaglineLines,
      fontSize: text.taglineFs,
      floor: taglineFloor,
      fontWeight: 500,
      opacity: 0.85,
      gapBefore: Math.round(text.height * 0.035),
    }),
  ];
}
