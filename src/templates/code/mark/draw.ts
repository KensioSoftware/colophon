import { box } from "../../../layout/index.js";
import type { MarkSpan } from "./locate.js";

/** Where the code sits, so a mark can be put over the right characters. */
export interface MarkMetrics {
  /** Where column zero of the code is, past the gutter. */
  readonly originX: number;
  readonly originY: number;
  readonly charWidth: number;
  readonly fontSize: number;
  readonly step: number;
  /** Across, for a mark that takes a whole line rather than a span of one. */
  readonly band: { readonly x: number; readonly width: number };
}

/** Clear space around the marked characters, as a fraction of the size. */
const padScale = 0.16;

/** The band a line's glyphs are drawn in, which is what a mark encloses. */
function lineRect(
  span: MarkSpan,
  metrics: MarkMetrics,
): { y: number; height: number } {
  const { originY, step, fontSize } = metrics;
  const pad = fontSize * padScale;

  return {
    y: Math.round(originY + span.line * step + (step - fontSize) / 2 - pad),
    height: Math.round(fontSize + pad * 2),
  };
}

/**
 * A mark over one span of code: a box around the characters, or a band across
 * the line where the post named no columns.
 *
 * The box is stroked and the band is filled, which is the difference between
 * pointing at something and highlighting it. Both take the palette's warm
 * accent by default, so a mark is the one thing on the image that is neither
 * the code theme's colours nor the site's brand.
 */
export function markSvg(
  span: MarkSpan,
  metrics: MarkMetrics,
  color: string,
): string {
  const { originX, charWidth, fontSize } = metrics;
  const { y, height } = lineRect(span, metrics);
  const fill = span.color ?? color;

  if (span.length === undefined) {
    return box(
      { x: metrics.band.x, y, width: metrics.band.width, height },
      { radius: Math.round(fontSize * 0.2), fill, fillOpacity: 0.16 },
    );
  }

  const pad = charWidth * padScale;

  return box(
    {
      x: Math.round(originX + span.column * charWidth - pad),
      y,
      width: Math.round(span.length * charWidth + pad * 2),
      height,
    },
    {
      radius: Math.round(fontSize * 0.2),
      stroke: fill,
      strokeWidth: Math.max(1, Math.round(fontSize * 0.08)),
    },
  );
}
