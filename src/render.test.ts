import {
  assertArrayLength,
  assertBufferEqual,
  assertIdentical,
  assertObjectEquals,
  assertStringEndsWith,
  assertStringIncludes,
  assertStringStartsWith,
  assertThrowsError,
  assertThrowsErrorAsync,
} from "@kensio/smartass";
import sharp from "sharp";
import { describe, it } from "vitest";

import { resolveConfig } from "./config.js";
import { buildSvg, renderMetaImages, renderSvgToPng } from "./render.js";

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

describe("buildSvg", () => {
  it("wraps background and template body in a sized svg root", () => {
    const svg = buildSvg({ template: "banner", title: "hi" }, resolveConfig(), {
      width: 640,
      height: 480,
    });

    assertStringStartsWith(svg, '<svg width="640" height="480"');
    assertStringIncludes(svg, 'viewBox="0 0 640 480"');
    assertStringIncludes(svg, '<linearGradient id="colophon-bg"');
    assertStringIncludes(svg, ">hi</text>");
    assertStringEndsWith(svg, "</svg>");
  });

  it("throws a helpful error for an unknown template", () => {
    const error = assertThrowsError(() =>
      buildSvg({ template: "nope", title: "x" }, resolveConfig(), {
        width: 10,
        height: 10,
      }),
    );

    assertStringIncludes(error.message, 'Unknown template "nope"');
    assertStringIncludes(error.message, "banner, card");
  });
});

describe("renderSvgToPng", () => {
  it("produces a PNG at the requested size", async () => {
    const svg = buildSvg({ template: "card", title: "x" }, resolveConfig(), {
      width: 48,
      height: 24,
    });
    const png = await renderSvgToPng(svg, { width: 48, height: 24 });

    assertBufferEqual(png.subarray(0, 4), pngSignature);

    const metadata = await sharp(png).metadata();
    assertIdentical(metadata.format, "png");
    assertIdentical(metadata.width, 48);
    assertIdentical(metadata.height, 24);
  }, 5000);
});

describe("renderMetaImages", () => {
  it("renders one named PNG per configured size", async () => {
    const images = await renderMetaImages(
      { template: "banner", title: "hello", version: "1.0.0" },
      {
        sizes: [
          { name: "og", width: 64, height: 64 },
          { name: "tiny", width: 48, height: 24 },
        ],
      },
    );

    assertArrayLength(images, 2);
    assertIdentical(images[0].name, "og");
    assertObjectEquals(images[0].dimensions, { width: 64, height: 64 });
    assertStringIncludes(images[0].svg, ">hello</text>");
    assertBufferEqual(images[0].png.subarray(0, 4), pngSignature);
    assertIdentical(images[1].name, "tiny");
    assertObjectEquals(images[1].dimensions, { width: 48, height: 24 });
  }, 5000);

  it("rejects before rendering when the template is unknown", async () => {
    const error = await assertThrowsErrorAsync(async () =>
      renderMetaImages({ template: "missing", title: "x" }),
    );

    assertStringIncludes(error.message, 'Unknown template "missing"');
  });
});
