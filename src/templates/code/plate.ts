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
 */
export function panelSvg(
  panel: Panel,
  background: string,
  shadowOffset: number,
): string {
  const shadow =
    `<rect x="${String(panel.x)}" y="${String(panel.y + shadowOffset)}"` +
    ` width="${String(panel.width)}" height="${String(panel.height)}"` +
    ` rx="${String(panel.radius)}" fill="#000000" fill-opacity="0.22"/>`;

  const surface =
    `<rect x="${String(panel.x)}" y="${String(panel.y)}"` +
    ` width="${String(panel.width)}" height="${String(panel.height)}"` +
    ` rx="${String(panel.radius)}" fill="${background}"` +
    ` stroke="#ffffff" stroke-opacity="0.12"/>`;

  return shadow + surface;
}
