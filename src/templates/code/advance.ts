import type { MeasureText } from "../../types.js";

/**
 * Advance width to assume when the monospace stack names no font the build
 * loaded. `0.6` suits most monospace faces, including Source Code Pro, Menlo
 * and DejaVu Sans Mono; Consolas is nearer `0.55`.
 *
 * This used to be `config.code.charWidthRatio`, a number every project had to
 * work out for itself and keep in step with its font. It is a fallback now:
 * supply the face as a file and the real advance is read from it.
 */
const fallbackRatio = 0.6;

/** How wide a piece of the snippet is, as a multiple of the font size. */
export type Advance = (text: string) => number;

/**
 * Measure text in the face the snippet is drawn in.
 *
 * The template used to place each token at its character index times a fixed
 * cell, which is right only where every character is one cell wide. A hanzi is
 * a full em in a cell sized for six tenths of one, so a token after one was
 * drawn some 40% of a cell too far left for every full-width character before
 * it, and the tokens overlapped. Measuring the text instead asks the face what
 * it is going to draw, which is the same question the measurer already answers
 * for every other template.
 */
export function codeAdvance(measure: MeasureText, fontFamily: string): Advance {
  return (text: string): number =>
    measure(text, { fontFamily, fontSize: 1, fontWeight: 400, fallbackRatio });
}

/**
 * Width of one cell of the monospace grid.
 *
 * Some of the layout really is a grid of cells rather than a run of text: the
 * line numbers are digits in a monospace face, and the gap between them and
 * the code is a count of spaces. Measuring a digit is enough for those, since
 * whichever character is measured the advance is the same.
 */
export function cellWidth(advance: Advance): number {
  return advance("0");
}
