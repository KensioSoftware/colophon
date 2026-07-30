import { toBase64 } from "../platform/base64.js";
import { readFileBytes } from "../platform/read-file.node.js";
import type { ImageAsset, ImageSource } from "../types.js";
import { sniffMediaType } from "./media.js";
import { aspectOf } from "./size.js";

/**
 * Loaded images, keyed by the path they were read from. A build draws the same
 * logo onto every image it generates, and the bytes are the largest thing in
 * the SVG, so reading and encoding it once matters more here than it does for
 * a font.
 */
const byPath = new Map<string, Promise<ImageAsset>>();

/** The same for images given as bytes, keyed by the array itself. */
const byData = new WeakMap<Uint8Array, Promise<ImageAsset>>();

/**
 * Turn bytes into something drawable: a `data:` URI and the proportions of the
 * picture inside it.
 *
 * Inlining rather than referencing the file is what makes a generated image
 * self-contained. The rasteriser would have to resolve a relative href against
 * something, and there is nothing sensible to resolve it against when the SVG
 * only ever exists in memory.
 */
function toAsset(bytes: Uint8Array, label: string): ImageAsset {
  const mediaType = sniffMediaType(bytes);

  if (mediaType === undefined) {
    throw new Error(
      `${label} is not an image this can read. PNG, JPEG, GIF, WebP and SVG` +
        ` are understood, and the bytes given match none of them.`,
    );
  }

  return {
    href: `data:${mediaType};base64,${toBase64(bytes)}`,
    aspect: aspectOf(bytes, mediaType) ?? 1,
  };
}

async function read(source: ImageSource, label: string): Promise<ImageAsset> {
  const bytes =
    "data" in source ? source.data : await readFileBytes(source.path);

  return toAsset(bytes, label);
}

/** Load one image source, reusing the bytes across the images of a build. */
export function loadImage(
  source: ImageSource,
  label: string,
): Promise<ImageAsset> {
  if ("data" in source) {
    const pending = byData.get(source.data) ?? read(source, label);
    byData.set(source.data, pending);
    return pending;
  }

  const pending = byPath.get(source.path) ?? read(source, label);
  byPath.set(source.path, pending);
  return pending;
}
