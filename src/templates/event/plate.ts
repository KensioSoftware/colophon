import type { Rect } from "../../layout/index.js";
import type { MeasureText, ResolvedConfig } from "../../types.js";
import type { PillStyle } from "../pill.js";
import { pill, pillWidth } from "../pill.js";

/** The plate's height, as a fraction of the image's. */
const plateScale = 0.07;

/** How the date's plate is filled and set. */
export function plateStyle(config: ResolvedConfig): PillStyle {
  return {
    fontFamily: config.fontFamily,
    fontWeight: 700,
    fill: config.colors.foreground,
    background: config.colors.brandWarm,
  };
}

/** How tall the plate is, or nothing at all where the post named no date. */
export function plateHeight(date: string, imageHeight: number): number {
  return date === "" ? 0 : Math.round(imageHeight * plateScale);
}

/**
 * The date on its plate, centred in the slot the stack gave it, or nothing
 * where the post named no date.
 *
 * The slot is the full width of the content area, since that is what a stack
 * hands back, and the plate is only as wide as the words on it.
 */
export function datePlate(
  date: string,
  slot: Rect | undefined,
  style: PillStyle,
  measure: MeasureText,
): string {
  if (date === "" || slot === undefined || slot.height === 0) {
    return "";
  }

  const width = pillWidth(date, slot.height, style, measure);

  return pill(
    date,
    {
      x: Math.round(slot.x + (slot.width - width) / 2),
      y: slot.y,
      width,
      height: slot.height,
    },
    style,
  );
}
