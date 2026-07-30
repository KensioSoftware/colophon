/**
 * Reading a PNG back, which is what the visual regression check compares two
 * images with, and which nothing else in the package needs.
 *
 * Split from `visual.test.ts` because it is a different subject: that file is
 * about the pictures the templates draw, and this one is about the bytes they
 * are stored in.
 */
import { renderAsync } from "@resvg/resvg-js";
import {
  assertArrayEquals,
  assertBufferEqual,
  assertObjectEquals,
  assertStringIncludes,
  assertThrowsError,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { decodePng } from "../test/visual/png.js";
import { unfilterRow } from "../test/visual/unfilter.js";

describe("decodePng", () => {
  it("reads back the pixels the rasteriser encoded", async () => {
    // Every sample is decoded the same way, so a decoder that got PNG's row
    // filters wrong would still compare one image against another and see
    // nothing. This is the one place with something else to check against:
    // resvg hands out the raw pixels alongside the PNG it made from them.
    // Shapes rather than a flat fill, so there is something in the rows for the
    // encoder's filtering to work on.
    const rendered = await renderAsync(
      '<svg width="60" height="40" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="60" height="40" fill="#1e3a8a" />' +
        '<circle cx="20" cy="18" r="14" fill="#f59e0b" />' +
        '<path d="M30 40 L48 6 L60 40 Z" fill="#065f46" />' +
        "</svg>",
    );
    const decoded = decodePng(rendered.asPng());

    assertObjectEquals(
      { width: decoded.width, height: decoded.height },
      { width: 60, height: 40 },
    );
    assertBufferEqual(Buffer.from(decoded.pixels), rendered.pixels);
  }, 5000);

  it("refuses something that is not a PNG", () => {
    const error = assertThrowsError(() => {
      decodePng(Buffer.from("not a picture at all, but long enough to look"));
    });

    assertStringIncludes(error.message, "not a PNG image");
  });

  it("refuses a colour type it does not read", async () => {
    // What this guards against is a resvg that starts writing something else:
    // a palette decoded as RGBA is a comparison of nonsense, and it has to say
    // so rather than show up as every baseline drifting at once.
    const rendered = await renderAsync(
      '<svg width="4" height="4" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="4" height="4" fill="#000000" /></svg>',
    );
    const greyscale = Buffer.from(rendered.asPng());
    greyscale[25] = 0;

    const error = assertThrowsError(() => {
      decodePng(greyscale);
    });

    assertStringIncludes(error.message, "colour type 0");
  }, 5000);
});

const rowOf = (...bytes: number[]): Uint8Array => Uint8Array.from(bytes);

/** One row, unfiltered, as plain numbers to assert on. */
function unfiltered(
  filter: number,
  row: Uint8Array,
  previous?: Uint8Array,
): number[] {
  unfilterRow(filter, row, previous);

  return [...row];
}

/**
 * The row filters, checked directly because no image reaches four of the five:
 * resvg encodes every row of every sample with `Sub`. Two pixels of four bytes
 * each is enough, since a filter only ever looks one pixel left and one row up.
 */
describe("unfilterRow", () => {
  it("leaves an unfiltered row alone", () => {
    assertArrayEquals(
      unfiltered(0, rowOf(1, 2, 3, 4, 5, 6, 7, 8)),
      [1, 2, 3, 4, 5, 6, 7, 8],
    );
  });

  it("adds the pixel to the left", () => {
    assertArrayEquals(
      unfiltered(1, rowOf(10, 20, 30, 40, 5, 5, 5, 5)),
      [10, 20, 30, 40, 15, 25, 35, 45],
    );
  });

  it("adds the pixel above", () => {
    const previous = rowOf(10, 20, 30, 40, 50, 60, 70, 80);

    assertArrayEquals(
      unfiltered(2, rowOf(1, 2, 3, 4, 1, 1, 1, 1), previous),
      [11, 22, 33, 44, 51, 61, 71, 81],
    );
  });

  it("adds the mean of left and above", () => {
    const previous = rowOf(20, 20, 20, 20, 40, 40, 40, 40);

    assertArrayEquals(
      unfiltered(3, rowOf(10, 10, 10, 10, 2, 2, 2, 2), previous),
      [20, 20, 20, 20, 32, 32, 32, 32],
    );
  });

  it("adds the Paeth predictor, taking above where it is closest", () => {
    const previous = rowOf(10, 10, 10, 10, 20, 20, 20, 20);

    assertArrayEquals(
      unfiltered(4, rowOf(5, 5, 5, 5, 1, 1, 1, 1), previous),
      [15, 15, 15, 15, 21, 21, 21, 21],
    );
  });

  it("adds the Paeth predictor, taking left where it is closest", () => {
    const previous = rowOf(0, 0, 0, 0, 0, 0, 0, 0);

    assertArrayEquals(
      unfiltered(4, rowOf(7, 7, 7, 7, 3, 3, 3, 3), previous),
      [7, 7, 7, 7, 10, 10, 10, 10],
    );
  });

  it("prefers above to upper-left where the two are equally close", () => {
    // The spec's tie-breaking order, which is part of the definition rather
    // than an implementation detail: an estimate three levels from each of
    // above and upper-left takes above.
    const previous = rowOf(10, 10, 10, 10, 4, 4, 4, 4);

    assertArrayEquals(
      unfiltered(4, rowOf(3, 3, 3, 3, 1, 1, 1, 1), previous),
      [13, 13, 13, 13, 5, 5, 5, 5],
    );
  });

  it("wraps a sum past 255, as the spec's byte arithmetic does", () => {
    assertArrayEquals(
      unfiltered(1, rowOf(250, 0, 0, 0, 10, 0, 0, 0)),
      [250, 0, 0, 0, 4, 0, 0, 0],
    );
  });

  it("refuses a filter type PNG does not have", () => {
    const error = assertThrowsError(() => {
      unfilterRow(5, rowOf(1, 2, 3, 4), undefined);
    });

    assertStringIncludes(error.message, "Unsupported PNG row filter 5");
  });
});
