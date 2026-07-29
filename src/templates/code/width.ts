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

/**
 * Width of one character as a fraction of the font size.
 *
 * The template lays every token out on a character grid, so this is what says
 * where each column falls. Measuring a digit is enough because the face is
 * monospace: whichever character is measured, the advance is the same.
 */
export function charWidthRatio(
  measure: MeasureText,
  fontFamily: string,
): number {
  return measure("0", {
    fontFamily,
    fontSize: 1,
    fontWeight: 400,
    fallbackRatio,
  });
}
