import { box } from "./box.js";
import type { BoxStyle, Rect } from "./types.js";

/** A panel is a box that casts a shadow. */
export interface PanelStyle extends BoxStyle {
  /**
   * How far the shadow falls below the panel. Omit for none, which is right
   * for a panel that is a region of the image rather than a card on top of it.
   */
  readonly shadow?: number;
  readonly shadowColor?: string;
  readonly shadowOpacity?: number;
}

const defaultShadowColor = "#000000";
const defaultShadowOpacity = 0.22;

/**
 * A raised plate: a soft shadow, then the surface on top of it.
 *
 * The shadow is a second rectangle rather than a blur filter. It costs a
 * rasteriser nothing, it survives every backend, and at these sizes a hard
 * offset reads as depth just as well as a blurred one.
 */
export function panel(rect: Rect, style: PanelStyle = {}): string {
  const { shadow, shadowColor, shadowOpacity, ...surface } = style;

  if (shadow === undefined) {
    return box(rect, surface);
  }

  return (
    box(
      { ...rect, y: rect.y + shadow },
      {
        ...(surface.radius !== undefined && { radius: surface.radius }),
        fill: shadowColor ?? defaultShadowColor,
        fillOpacity: shadowOpacity ?? defaultShadowOpacity,
      },
    ) + box(rect, surface)
  );
}
