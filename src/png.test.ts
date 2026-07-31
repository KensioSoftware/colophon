/**
 * The PNG container, as against the picture in it: taking a finished image
 * apart and encoding its data again at a level the rasteriser did not choose.
 *
 * The claim worth testing here is that nothing about the picture changes, so
 * the decoder the visual regression check is built on is what most of this
 * asserts against. Comparing the two files byte for byte would only say they
 * differ, which is the point of the exercise.
 */
import { crc32, inflateSync } from "node:zlib";

import {
  assertArrayEquals,
  assertBufferEqual,
  assertIdentical,
  assertTrue,
  assertUndefined,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { decodePng } from "../test/visual/png.js";
import { resolveConfig } from "./config/index.js";
import { readChunks, recompressPng } from "./png/index.js";
import { renderSvgToPng } from "./render/index.js";
import { stampPng } from "./stamp/index.js";

/**
 * Something with enough going on in it that the encoder has real choices to
 * make. A flat fill compresses to almost nothing whatever the level, so it
 * would say nothing about whether the level was used.
 */
const busySvg =
  '<svg width="200" height="120" xmlns="http://www.w3.org/2000/svg">' +
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0%" stop-color="#3730a3"/>' +
  '<stop offset="100%" stop-color="#db2777"/></linearGradient></defs>' +
  '<rect width="200" height="120" fill="url(#g)"/>' +
  '<circle cx="70" cy="50" r="34" fill="#f59e0b" opacity="0.7"/>' +
  '<path d="M120 120 L170 20 L200 120 Z" fill="#065f46"/>' +
  "</svg>";

const dimensions = { width: 200, height: 120 };

/** One rendering, at the level asked for. */
async function render(compressionLevel: number): Promise<Buffer> {
  return renderSvgToPng(
    busySvg,
    dimensions,
    resolveConfig({ compressionLevel }),
  );
}

/** The image every case here starts from: rendered, and not recompressed. */
async function original(): Promise<Buffer> {
  return render(0);
}

/** A PNG's image data, inflated: the filtered scanlines as the encoder left them. */
function scanlines(png: Buffer): Buffer {
  return inflateSync(
    Buffer.concat(
      (readChunks(png) ?? [])
        .filter(({ type }) => type === "IDAT")
        .map(({ data }) => data),
    ),
  );
}

/**
 * Every chunk type in a PNG, checking each one's stored CRC against the bytes
 * it covers. A rebuilt image is then verified as still structurally valid,
 * rather than merely as still starting with a PNG signature.
 */
function chunkTypes(png: Buffer): string[] {
  const types: string[] = [];

  for (let offset = 8; offset + 12 <= png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("latin1", offset + 4, offset + 8);
    const covered = png.subarray(offset + 4, offset + 8 + length);

    assertIdentical(
      png.readUInt32BE(offset + 8 + length),
      crc32(covered),
      type,
    );
    types.push(type);
    offset += length + 12;
  }

  return types;
}

describe("recompressPng", () => {
  it("makes the file smaller without moving a pixel", async () => {
    const png = await original();
    const smaller = await recompressPng(png, 9);

    assertTrue(
      smaller.length < png.length,
      `expected a saving; ${String(png.length)} -> ${String(smaller.length)}`,
    );
    assertBufferEqual(decodePng(smaller).pixels, decodePng(png).pixels);
  });

  it("keeps the row filters as well as the pixels", async () => {
    // Stronger than comparing the decoded images: the scanlines are inflated
    // and deflated again untouched, so the bytes under the zlib stream are the
    // same ones rather than a re-encoding that happens to decode the same way.
    const png = await original();

    assertBufferEqual(scanlines(await recompressPng(png, 9)), scanlines(png));
  });

  it("leaves the bytes alone at level 0", async () => {
    const png = await original();

    assertBufferEqual(await recompressPng(png, 0), png);
  });

  it("keeps every other chunk, the stamp included", async () => {
    // The stamp goes in after this runs in a build, but a chunk that survives
    // a round trip here is what says a `pHYs` or a `gAMA` would survive too.
    const stamped = stampPng(await original(), "abc123");
    const smaller = await recompressPng(stamped, 9);

    assertArrayEquals(chunkTypes(smaller), ["IHDR", "tEXt", "IDAT", "IEND"]);
  });

  it("hands back anything that is not a PNG it can rebuild", async () => {
    const notPng = Buffer.from("GIF89a and then some", "latin1");

    assertUndefined(readChunks(notPng));
    assertBufferEqual(await recompressPng(notPng, 9), notPng);
  });

  it("hands back a PNG whose chunks run off the end", async () => {
    const png = await original();
    const truncated = png.subarray(0, 40);

    assertBufferEqual(await recompressPng(truncated, 9), truncated);
  });
});

describe("renderSvgToPng", () => {
  it("compresses at the configured level", async () => {
    const [none, some, most] = await Promise.all([
      render(0),
      render(6),
      render(9),
    ]);
    const sizes = `${String(most.length)}, ${String(some.length)}, ${String(
      none.length,
    )}`;

    assertTrue(some.length < none.length, `expected 6 to beat 0; ${sizes}`);
    assertTrue(most.length <= some.length, `expected 9 to beat 6; ${sizes}`);
    assertBufferEqual(decodePng(most).pixels, decodePng(none).pixels);
  });
});
