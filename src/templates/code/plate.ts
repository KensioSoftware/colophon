import { panel } from "../../layout/index.js";
import type { ResolvedConfig } from "../../types.js";
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
 *
 * A panel the background shows through casts no shadow. The shadow is the same
 * rectangle offset a few pixels, so a translucent surface shows most of it as
 * a dark wash across the panel, which reads as a smudge rather than as depth.
 * A pane of glass is not a raised card, and this is the difference.
 */
export function panelSvg(
  available: Panel,
  background: string,
  shadowOffset: number,
  config: ResolvedConfig,
): string {
  const { panelOpacity, borderColor, borderOpacity } = config.code;

  // A full-opacity surface says nothing about its opacity, which keeps the
  // common case's output to what the template actually decided.
  return panel(available, {
    radius: available.radius,
    fill: background,
    stroke: borderColor,
    strokeOpacity: borderOpacity,
    ...(panelOpacity < 1
      ? { fillOpacity: panelOpacity }
      : { shadow: shadowOffset }),
  });
}
