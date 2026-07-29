import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  assertIdentical,
  assertNumberBetween,
  assertStringIncludes,
  assertStringStartsWith,
  assertThrowsError,
  assertThrowsErrorAsync,
  assertUndefined,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { resolveConfig } from "./config/index.js";
import { loadImage, loadImages, resolveImageSource } from "./image/index.js";
import { sniffMediaType } from "./image/media.js";
import { aspectOf } from "./image/size.js";
import { bytesFromDataUri } from "./image/uri.js";

// A real PNG, so the header is one an encoder actually wrote.
const samplePng = path.join(process.cwd(), "docs/samples/card-wide-solid.png");

/** The shortest JPEG that still says how big it is: SOI, APP0, then SOF0. */
const jpeg = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01,
  0x90, 0x02, 0x80, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
]);

/** `GIF89a` and a screen size of 256x128, little-endian. */
const gif = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x01, 0x80, 0x00, 0x00,
]);

const webp = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

function svgBytes(root: string): Uint8Array {
  return new TextEncoder().encode(`<?xml version="1.0"?>\n<svg ${root}></svg>`);
}

describe("sniffMediaType", () => {
  it("names each format from its own bytes", async () => {
    assertIdentical(sniffMediaType(await readFile(samplePng)), "image/png");
    assertIdentical(sniffMediaType(jpeg), "image/jpeg");
    assertIdentical(sniffMediaType(gif), "image/gif");
    assertIdentical(sniffMediaType(webp), "image/webp");
    assertIdentical(sniffMediaType(svgBytes("")), "image/svg+xml");
  });

  it("names nothing for bytes that are not an image", () => {
    assertUndefined(sniffMediaType(new TextEncoder().encode("hello there")));
  });
});

describe("aspectOf", () => {
  it("reads a PNG's dimensions from its header chunk", async () => {
    const bytes = await readFile(samplePng);

    // The sample is 1200x630.
    assertNumberBetween(aspectOf(bytes, "image/png") ?? 0, 1.9, 1.91);
  });

  it("walks a JPEG's segments to its frame header", () => {
    // 640x400.
    assertNumberBetween(aspectOf(jpeg, "image/jpeg") ?? 0, 1.59, 1.61);
  });

  it("reads a GIF's screen size", () => {
    assertIdentical(aspectOf(gif, "image/gif"), 2);
  });

  it("takes an SVG's width and height, then its viewBox", () => {
    assertIdentical(
      aspectOf(svgBytes('width="60" height="20"'), "image/svg+xml"),
      3,
    );
    assertIdentical(
      aspectOf(svgBytes('viewBox="0 0 120 40"'), "image/svg+xml"),
      3,
    );
    assertIdentical(
      aspectOf(svgBytes('width="6em" height="2em"'), "image/svg+xml"),
      3,
    );
  });

  it("falls through to the viewBox for an SVG sized in percentages", () => {
    // The commonest export shape: scales to its container, and its proportions
    // are only in the viewBox.
    assertIdentical(
      aspectOf(
        svgBytes('width="100%" height="100%" viewBox="0 0 120 40"'),
        "image/svg+xml",
      ),
      3,
    );
  });

  it("says nothing for an SVG that states no size at all", () => {
    assertUndefined(aspectOf(svgBytes('fill="red"'), "image/svg+xml"));
  });

  it("says nothing for WebP, whose header this does not read", () => {
    assertUndefined(aspectOf(webp, "image/webp"));
  });
});

/** What a data URI holds, as text. */
function decodeUri(uri: string): string {
  return new TextDecoder().decode(bytesFromDataUri(uri, "x"));
}

describe("bytesFromDataUri", () => {
  it("decodes base64 and percent-encoded bodies alike", () => {
    const svg = "<svg/>";
    // eslint-disable-next-line unicorn/prefer-uint8array-base64
    const encoded = Buffer.from(svg).toString("base64");

    assertIdentical(decodeUri(`data:image/svg+xml;base64,${encoded}`), svg);
    assertIdentical(
      decodeUri(`data:image/svg+xml,${encodeURIComponent(svg)}`),
      svg,
    );
  });

  it("rejects a URI with no body", () => {
    assertThrowsError(() => bytesFromDataUri("data:image/png", "logo"), "logo");
  });
});

describe("resolveImageSource", () => {
  it("makes a path absolute", () => {
    const relative = path.relative(process.cwd(), samplePng);
    const resolved = resolveImageSource({ path: relative }, "logo");

    assertIdentical("path" in resolved ? resolved.path : "", samplePng);
  });

  it("names the file it could not find", () => {
    assertThrowsError(
      () => resolveImageSource({ path: "nope.png" }, "logo"),
      "image file not found",
    );
  });

  it("rejects a source that is neither, or both", () => {
    assertThrowsError(
      () => resolveImageSource({} as never, "logo"),
      'needs a "path"',
    );
    assertThrowsError(
      () => resolveImageSource({ data: new Uint8Array() }, "logo"),
      "empty image data",
    );
    assertThrowsError(
      () => resolveImageSource({ path: samplePng, data: gif }, "logo"),
      "give one or the other",
    );
  });
});

describe("loadImage", () => {
  it("inlines the bytes and measures the picture", async () => {
    const asset = await loadImage({ path: samplePng }, "logo");

    assertStringStartsWith(asset.href, "data:image/png;base64,");
    assertNumberBetween(asset.aspect, 1.9, 1.91);
  });

  it("reads one path once, however many images use it", async () => {
    const first = loadImage({ path: samplePng }, "logo");

    assertIdentical(await loadImage({ path: samplePng }, "logo"), await first);
  });

  it("treats a format it cannot read as an error", async () => {
    await assertThrowsErrorAsync(
      async () => loadImage({ data: new TextEncoder().encode("nope") }, "logo"),
      "not an image this can read",
    );
  });

  it("falls back to a square for a format whose size it cannot read", async () => {
    const asset = await loadImage({ data: webp }, "logo");

    assertStringIncludes(asset.href, "data:image/webp;base64,");
    assertIdentical(asset.aspect, 1);
  });
});

describe("loadImages", () => {
  it("takes an avatar prop as a path or as a data URI", async () => {
    const config = resolveConfig();
    const encoded = `data:image/gif;base64,${
      // eslint-disable-next-line unicorn/prefer-uint8array-base64
      Buffer.from(gif).toString("base64")
    }`;

    const fromPath = await loadImages(config, {
      template: "card",
      avatar: samplePng,
    });
    const fromUri = await loadImages(config, {
      template: "card",
      avatar: encoded,
    });

    assertStringStartsWith(fromPath.avatar?.href ?? "", "data:image/png");
    assertStringStartsWith(fromUri.avatar?.href ?? "", "data:image/gif");
  });

  it("loads nothing for a post and a config that name nothing", async () => {
    const images = await loadImages(resolveConfig(), { template: "card" });

    assertUndefined(images.logo);
    assertUndefined(images.avatar);
    assertUndefined(images.background);
  });
});

describe("extents that cannot be read", () => {
  it("says nothing for a header cut short", () => {
    assertUndefined(aspectOf(new Uint8Array(8), "image/png"));
    assertUndefined(aspectOf(new Uint8Array(4), "image/gif"));
  });

  it("says nothing for a JPEG with no frame header in it", () => {
    // SOI, then a comment segment, and then nothing that declares a size.
    const headerless = new Uint8Array([
      0xff, 0xd8, 0xff, 0xfe, 0x00, 0x04, 0x00, 0x00,
    ]);

    assertUndefined(aspectOf(headerless, "image/jpeg"));
  });

  it("says nothing for a JPEG cut off inside its frame header", () => {
    const truncated = new Uint8Array([
      0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00,
    ]);

    assertUndefined(aspectOf(truncated, "image/jpeg"));
  });

  it("walks past padding and standalone markers to the frame header", () => {
    // A stray 0xff pad and a standalone marker before the frame header.
    const padded = new Uint8Array([
      0xff, 0xd8, 0xff, 0xff, 0xff, 0x01, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00,
      0x64, 0x00, 0xc8, 0x03,
    ]);

    // 200x100.
    assertIdentical(aspectOf(padded, "image/jpeg"), 2);
  });
});
