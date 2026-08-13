import type { TextLine } from "../../layout/index.js";
import { measureIn, trackingFor } from "../../layout/index.js";
import type { MeasureText } from "../../types.js";

/**
 * The most a line may be tracked, as a fraction of its own font size.
 *
 * Stretching a strapline to sit under a name is a typesetter's adjustment, and
 * past a certain point it stops being one: a two-word tagline pulled out to the
 * width of a long name reads as broken rather than as considered. Half an em
 * between characters is where that starts, so a line needing more than this is
 * left alone rather than drawn badly.
 */
const maxTracking = 0.5;

/** How wide one line is drawn, before any tracking is added to it. */
function naturalWidth(
  line: TextLine,
  measure: MeasureText,
  fontFamily: string,
): number {
  return measureIn(
    measure,
    fontFamily,
    line.fontWeight,
  )(line.text, line.fontSize);
}

/**
 * Stretch a single line of tagline out to the width of the name above it.
 *
 * This is the adjustment somebody makes by hand in a drawing program and then
 * has to make again every time the words change: the wordmark and the line
 * under it share both edges, so the pair reads as one block rather than as two
 * lines that happen to be centred together.
 *
 * Only a tagline of one line is tracked. Justifying every line of a wrapped
 * one to the same width is a different thing to want, and it goes wrong on the
 * short last line in the way justified text always does.
 */
export function trackTagline(
  name: readonly TextLine[],
  tagline: readonly TextLine[],
  measure: MeasureText,
  fontFamily: string,
): readonly TextLine[] {
  const [first] = name;
  const [line] = tagline;

  if (first === undefined || line === undefined || tagline.length !== 1) {
    return tagline;
  }

  const tracking = trackingFor(
    line.text,
    naturalWidth(line, measure, fontFamily),
    naturalWidth(first, measure, fontFamily),
  );

  if (tracking > line.fontSize * maxTracking) {
    return tagline;
  }

  return [{ ...line, letterSpacing: tracking }];
}
