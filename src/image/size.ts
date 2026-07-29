import { jpegExtent } from "./jpeg.js";
import type { MediaType } from "./media.js";
import { svgExtent } from "./svg.js";

/** How big an image is, in whatever units it states for itself. */
export interface Extent {
  readonly width: number;
  readonly height: number;
}

function view(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

/** PNG states its size in the IHDR chunk, which is always the first one. */
function pngExtent(bytes: Uint8Array): Extent | undefined {
  return bytes.length < 24
    ? undefined
    : { width: view(bytes).getUint32(16), height: view(bytes).getUint32(20) };
}

/** GIF states its screen size in the header, little-endian. */
function gifExtent(bytes: Uint8Array): Extent | undefined {
  return bytes.length < 10
    ? undefined
    : {
        width: view(bytes).getUint16(6, true),
        height: view(bytes).getUint16(8, true),
      };
}

/**
 * How wide an image is against how tall, or `undefined` where the format does
 * not say in any way this reads.
 *
 * Only the ratio is wanted. A template sizes a logo from the image it is
 * drawing into rather than from the logo's own pixels, since the same logo has
 * to work on a 1200x630 and a 1200x1200, and the ratio is what stops it being
 * stretched or given a square of space it does not fill.
 *
 * WebP is deliberately absent. Its dimensions live in one of three different
 * chunk layouts depending on how it was encoded, and a logo is a PNG or an SVG
 * often enough that guessing at bit-packed headers is not worth the risk of
 * getting one of them subtly wrong.
 */
export function aspectOf(
  bytes: Uint8Array,
  mediaType: MediaType,
): number | undefined {
  const extent = extentOf(bytes, mediaType);

  return extent === undefined || extent.height <= 0
    ? undefined
    : extent.width / extent.height;
}

function extentOf(bytes: Uint8Array, mediaType: MediaType): Extent | undefined {
  switch (mediaType) {
    case "image/png": {
      return pngExtent(bytes);
    }
    case "image/gif": {
      return gifExtent(bytes);
    }
    case "image/jpeg": {
      return jpegExtent(bytes);
    }
    case "image/svg+xml": {
      return svgExtent(bytes);
    }
    case "image/webp": {
      return undefined;
    }
  }
}
