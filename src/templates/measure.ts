import type { MeasureAt } from "../text/index.js";
import type { MeasureText } from "../types.js";

/**
 * Bind a measurer to one family and weight, leaving only the size open.
 *
 * That is the shape fitting text wants, since choosing a size is the whole of
 * what it varies, and it keeps a template from repeating the family and weight
 * on every call.
 */
export function measureIn(
  measure: MeasureText,
  fontFamily: string,
  fontWeight: number,
): MeasureAt {
  return (text: string, fontSize: number): number =>
    measure(text, { fontFamily, fontSize, fontWeight });
}
