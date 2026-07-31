import type { Sharp } from "sharp";

import type { OutputFormat } from "../types.js";

/**
 * The formats an image is encoded _into_, as against PNG, which is what the
 * rasteriser already produces and which has a lossless path of its own.
 */
export type LossyFormat = Exclude<OutputFormat, "png">;

/**
 * A raster opened for encoding: what it already is, and how to write it out
 * again as something else.
 */
export interface OpenRaster {
  /** The media type sharp read out of the bytes, e.g. `image/webp`. */
  readonly mediaType: string | undefined;
  /** The same picture as `format`, at `quality`. */
  encode(format: LossyFormat, quality: number): Promise<Buffer>;
}

/**
 * sharp, loaded on first use rather than imported at the top of the module.
 *
 * It is here for its encoders alone: resvg draws the picture, and this turns
 * the finished raster into the format a config asked for. The rasteriser is the
 * part that has to be reproducible, which is why sharp is not it.
 *
 * Loading it lazily is what keeps a PNG build from depending on it at all. A
 * native module has a binary per platform, and a static import would mean a
 * machine sharp has no build for could not render a PNG either, which is a
 * failure with nothing to do with the feature that brought sharp in.
 */
async function openSharp(raster: Buffer): Promise<Sharp> {
  const { default: sharp } = await import("sharp");

  return sharp(raster);
}

/** One encoding pass. sharp names a method per format rather than taking one. */
async function encodeWith(
  image: Sharp,
  format: LossyFormat,
  quality: number,
): Promise<Buffer> {
  switch (format) {
    case "jpeg": {
      return image.jpeg({ quality }).toBuffer();
    }
    case "webp": {
      return image.webp({ quality }).toBuffer();
    }
    case "avif": {
      return image.avif({ quality }).toBuffer();
    }
  }
}

/**
 * What the bytes already are.
 *
 * Bytes sharp cannot read are a rasteriser returning something no encoder here
 * knows, which is worth saying outright: the alternative is a decoder complaint
 * about a file the project never asked to have decoded.
 */
async function readMediaType(image: Sharp): Promise<string | undefined> {
  try {
    const { mediaType } = await image.metadata();

    return mediaType;
  } catch (error) {
    throw new Error(
      "Cannot encode the rendered image: the rasteriser returned bytes in a" +
        " format the encoder does not read. Set config.format to png to write" +
        " them as they are.",
      { cause: error },
    );
  }
}

/** Open some rendered bytes for encoding. */
export async function openRaster(raster: Buffer): Promise<OpenRaster> {
  const image = await openSharp(raster);

  return {
    mediaType: await readMediaType(image),
    encode: async (format, quality) => encodeWith(image, format, quality),
  };
}
