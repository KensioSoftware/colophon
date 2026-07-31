/**
 * Just enough PNG reading to compare two images, which the package otherwise
 * has no need for: it writes PNGs and never reads one back beyond the stamp in
 * its header.
 *
 * The only files this decodes are ones resvg wrote, so it handles exactly what
 * resvg emits, which is 8-bit RGBA with no interlacing, and refuses anything
 * else rather than guessing. A dependency would cover the whole format; this
 * covers the one corner of it a baseline comparison needs.
 *
 * The exception is row filters, where `unfilter.ts` implements all five even
 * though resvg's encoder picks `Sub` for every row of every image here, checked
 * by counting them. Handling only that one would mean a resvg upgrade that
 * chose its filters adaptively broke the comparison rather than the decode, so
 * the four that go unused are worth their forty lines. They are tested
 * directly, since no sample reaches them.
 */
import { inflateSync } from "node:zlib";

import { pngSignature } from "../../src/png/chunk.js";
import { unfilterRow } from "./unfilter.js";

/** An image as raw RGBA bytes, four per pixel, row by row from the top. */
export interface Bitmap {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
}

/** The colour type and bit depth resvg writes, and the only one read here. */
const rgba8 = { depth: 8, colorType: 6 } as const;

/** Header fields, at their fixed offsets in the `IHDR` chunk. */
function readHeader(png: Buffer): {
  readonly width: number;
  readonly height: number;
} {
  if (
    png.length < 33 ||
    !png.subarray(0, pngSignature.length).equals(pngSignature) ||
    png.toString("latin1", 12, 16) !== "IHDR"
  ) {
    throw new Error("Cannot decode: not a PNG image.");
  }

  const depth = png[24];
  const colorType = png[25];
  const interlace = png[28];

  if (
    depth !== rgba8.depth ||
    colorType !== rgba8.colorType ||
    interlace !== 0
  ) {
    throw new Error(
      `Cannot decode PNG: expected 8-bit RGBA with no interlacing, got depth` +
        ` ${String(depth)}, colour type ${String(colorType)}, interlace` +
        ` ${String(interlace)}.`,
    );
  }

  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

/**
 * The image data, which an encoder may split across several `IDAT` chunks and
 * which only means anything once they are joined back together.
 */
function imageData(png: Buffer): Buffer {
  const parts: Buffer[] = [];
  let offset = pngSignature.length;

  while (offset + 8 <= png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("latin1", offset + 4, offset + 8);

    if (type === "IEND") {
      break;
    }

    const start = offset + 8;

    if (type === "IDAT") {
      parts.push(png.subarray(start, start + length));
    }

    offset = start + length + 4;
  }

  if (parts.length === 0) {
    throw new Error("Cannot decode PNG: no image data.");
  }

  return inflateSync(Buffer.concat(parts));
}

/** Decode a PNG resvg wrote into its RGBA pixels. */
export function decodePng(png: Buffer): Bitmap {
  const { width, height } = readHeader(png);
  const data = imageData(png);
  const stride = width * 4;
  const expected = (stride + 1) * height;

  if (data.length !== expected) {
    throw new Error(
      `Cannot decode PNG: expected ${String(expected)} bytes of image data,` +
        ` got ${String(data.length)}.`,
    );
  }

  const pixels = new Uint8Array(stride * height);
  let previous: Uint8Array | undefined;

  for (let row = 0; row < height; row++) {
    const at = row * (stride + 1);
    const line = pixels.subarray(row * stride, (row + 1) * stride);

    line.set(data.subarray(at + 1, at + 1 + stride));
    unfilterRow(data[at] ?? 0, line, previous);
    previous = line;
  }

  return { width, height, pixels };
}
