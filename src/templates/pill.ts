import { baselineFor, box, measureIn, textElement } from "../layout/index.js";
import type { Rect } from "../layout/index.js";
import type { MeasureText } from "../types.js";

/** The text's size within the pill, as a fraction of its height. */
const textScale = 0.5;

/** Clear space at each end of the text, as a fraction of the pill's height. */
const padScale = 0.42;

/** How a pill is filled and set. */
export interface PillStyle {
  readonly fontFamily: string;
  readonly fontWeight: number;
  /** The text colour. */
  readonly fill: string;
  readonly background: string;
  readonly backgroundOpacity?: number;
  /** Corner radius. Defaults to half the height, so the ends are round. */
  readonly radius?: number;
}

/** The text size a pill of this height sets its label at. */
export function pillFontSize(height: number): number {
  return Math.round(height * textScale);
}

/**
 * How wide a pill has to be to hold its label.
 *
 * Measured rather than counted, because a tag is whatever word a post used and
 * a row of them is laid out before any of it is drawn. The corner badge on the
 * `banner` guesses from the character count, which is why it only ever holds a
 * word or two.
 */
export function pillWidth(
  text: string,
  height: number,
  style: PillStyle,
  measure: MeasureText,
): number {
  const fontSize = pillFontSize(height);
  const width = measureIn(
    measure,
    style.fontFamily,
    style.fontWeight,
  )(text, fontSize);

  return Math.round(width + height * padScale * 2);
}

/**
 * A label on a rounded plate: a tag on an article, a date on an event.
 *
 * The text is centred in the rectangle it was given rather than set from the
 * left, so a pill drawn wider than {@link pillWidth} asked for still looks
 * deliberate.
 */
export function pill(text: string, rect: Rect, style: PillStyle): string {
  const fontSize = pillFontSize(rect.height);

  const plate = box(rect, {
    fill: style.background,
    radius: style.radius ?? Math.round(rect.height / 2),
    ...(style.backgroundOpacity !== undefined && {
      fillOpacity: style.backgroundOpacity,
    }),
  });

  const label = textElement(text, {
    x: Math.round(rect.x + rect.width / 2),
    y: baselineFor(rect.y + (rect.height - fontSize) / 2, fontSize),
    fontFamily: style.fontFamily,
    fontSize,
    fontWeight: style.fontWeight,
    fill: style.fill,
    anchor: "middle",
  });

  return plate + label;
}
