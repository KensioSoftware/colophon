import { ellipsis } from "./ellipsis.js";
import type { MeasureAt } from "./fit.js";

/**
 * Cut one line to the width it has, marking the cut with an ellipsis.
 *
 * This is what a line that may not wrap does instead of wrapping: a bullet in
 * a list of changes, a breadcrumb, a window title. Shrinking is the better
 * answer wherever there is room for it, which is what `fitText` is for and why
 * most text goes through that instead. A line set alongside others at the same
 * size cannot shrink on its own without looking like a mistake.
 */
export function clampLine(
  text: string,
  maxWidth: number,
  measure: MeasureAt,
  fontSize: number,
): string {
  const full = measure(text, fontSize);

  if (full <= maxWidth || text === "") {
    return text;
  }

  const isWithin = (length: number): boolean =>
    measure(text.slice(0, length) + ellipsis, fontSize) <= maxWidth;

  // Start from what the width would be if every character were as wide as the
  // average, then walk to the real answer. A proportional face makes that a
  // guess rather than a result, so it is corrected in both directions. The
  // floor of nought is what stops a caller with no room left, which is a width
  // that has come out negative, reaching `slice` with a negative length and
  // being cut from the wrong end.
  let kept = Math.max(
    0,
    Math.min(text.length, Math.floor((text.length * maxWidth) / full)),
  );

  while (kept < text.length && isWithin(kept + 1)) {
    kept += 1;
  }

  while (kept > 0 && !isWithin(kept)) {
    kept -= 1;
  }

  return withoutSplitPair(text.slice(0, kept)).trimEnd() + ellipsis;
}

/**
 * Drop a trailing lone surrogate, which is what cutting by string index does
 * to a character outside the basic plane: an emoji in a changelog entry is two
 * units long, and half of one is not a character at all. Escaping it would put
 * an unpaired surrogate in the document.
 */
function withoutSplitPair(text: string): string {
  return /[\uD800-\uDBFF]$/.test(text) ? text.slice(0, -1) : text;
}
