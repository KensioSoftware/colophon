import { panel } from "../../layout/index.js";
import type { Panel } from "./panel.js";

/**
 * Shrink a panel onto its content, keeping it centred in the space it was
 * allotted. Both axes are floored so a small snippet still gets a panel with
 * presence rather than a letterbox slot or a narrow strip.
 */
export function hugPanel(
  available: Panel,
  wanted: { readonly width: number; readonly height: number },
): Panel {
  const width = Math.min(
    available.width,
    Math.max(Math.round(wanted.width), Math.round(available.width * 0.55)),
  );
  // Floor relative to the panel's own width, so shrinking never leaves a
  // sliver, and never taller than the space the font was fitted against.
  const height = Math.min(
    available.height,
    Math.max(Math.round(wanted.height), Math.round(width * 0.25)),
  );

  return {
    ...available,
    x: available.x + Math.round((available.width - width) / 2),
    y: available.y + Math.round((available.height - height) / 2),
    width,
    height,
  };
}

/**
 * The panel itself: a drop shadow, then the theme-coloured surface it sits on.
 * The surface is stroked rather than left flat, so a dark theme still has an
 * edge against a dark background.
 */
export function panelSvg(
  available: Panel,
  background: string,
  shadowOffset: number,
): string {
  return panel(available, {
    radius: available.radius,
    fill: background,
    stroke: "#ffffff",
    strokeOpacity: 0.12,
    shadow: shadowOffset,
  });
}
