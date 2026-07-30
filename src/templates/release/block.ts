import type { Rect } from "../../layout/index.js";
import type { MeasureText, ResolvedConfig } from "../../types.js";
import { changeList } from "./changes.js";

/**
 * The list in the slot the stack gave it, styled from the config, or nothing
 * where the post listed no changes and the stack gave it no room.
 */
export function changeBlock(
  items: readonly string[],
  slot: Rect | undefined,
  fontSize: number,
  config: ResolvedConfig,
  measure: MeasureText,
): string {
  return slot === undefined
    ? ""
    : changeList(
        items,
        slot,
        {
          fontFamily: config.fontFamily,
          fontSize,
          fill: config.colors.foreground,
          accent: config.colors.brandWarm,
        },
        measure,
      );
}
