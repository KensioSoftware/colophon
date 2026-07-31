import type { OutputFormat } from "../types.js";

/**
 * What each format is called on disk and on the wire.
 *
 * These are the encoder's own answers rather than `image/media.ts`'s. That
 * module sniffs the formats a build can _draw_ with, which is a different list
 * arrived at for a different reason: it has GIF and SVG, which nothing writes,
 * and it has no AVIF, which this does. The stamp carriers are kept apart from
 * it for the same reason.
 */
const extensions: Readonly<Record<OutputFormat, string>> = {
  png: ".png",
  // `.jpg` rather than `.jpeg`, which is what the web settled on and what a
  // reader looking at a directory of images expects to see.
  jpeg: ".jpg",
  webp: ".webp",
  avif: ".avif",
};

const mediaTypes: Readonly<Record<OutputFormat, string>> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
};

/** The extension an image of this format is written under, dot and all. */
export function extensionFor(format: OutputFormat): string {
  return extensions[format];
}

/** The media type an image of this format carries. */
export function mediaTypeFor(format: OutputFormat): string {
  return mediaTypes[format];
}

/**
 * Replace whatever extension a path ends with. Used for the SVG written
 * alongside an image, which is the same name with a different tail, so that a
 * hashed filename keeps its hash.
 */
export function withExtension(file: string, extension: string): string {
  return file.replace(/\.[^./\\]*$/, "") + extension;
}
