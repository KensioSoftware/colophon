import { textElement } from "../../layout/index.js";
import type { Rect } from "../../layout/index.js";

/**
 * How much of the glyph's own font size it takes up on the page.
 *
 * An opening quotation mark hangs at the top of its em: there is a cap height
 * of ink and then nothing, where a letter would have had a descender. Reserving
 * a full line for it leaves a hole between it and the words underneath, so the
 * band is a little over half the size it is set at, and the baseline sits at
 * the bottom of that band.
 */
const inkRatio = 0.56;

/** The band a quotation mark of this size needs. */
export function markBand(fontSize: number): number {
  return Math.round(fontSize * inkRatio);
}

/**
 * The opening quotation mark, centred above the quotation.
 *
 * It is drawn in the accent colour at a size no text on the image reaches, so
 * that a reader takes the words as quoted before reading any of them. That is
 * the whole job of this template: the same sentence set plainly reads as the
 * site's own opinion.
 */
export function quoteMark(
  slot: Rect | undefined,
  fontSize: number,
  fontFamily: string,
  fill: string,
): string {
  if (slot === undefined) {
    return "";
  }

  return textElement("“", {
    x: Math.round(slot.x + slot.width / 2),
    y: slot.y + slot.height,
    fontFamily,
    fontSize,
    fontWeight: 800,
    fill,
    fillOpacity: 0.55,
    anchor: "middle",
  });
}
