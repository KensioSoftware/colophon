import path from "node:path";

import {
  assertArrayLength,
  assertBufferEqual,
  assertFalse,
  assertIdentical,
  assertObjectEquals,
  assertStringEndsWith,
  assertStringIncludes,
  assertStringStartsWith,
  assertThrowsErrorAsync,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { resolveConfig } from "./config.js";
import { buildSvg, renderMetaImages, renderSvgToPng } from "./render.js";

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

// Real font files, so the tests exercise what a project would actually
// configure. DejaVu is a dev dependency; nothing ships with the package.
const fontDir = path.join(process.cwd(), "node_modules/dejavu-fonts-ttf/ttf");
const sansFont = path.join(fontDir, "DejaVuSans.ttf");
const serifFont = path.join(fontDir, "DejaVuSerif.ttf");

/**
 * Read the dimensions out of a PNG's IHDR chunk, which always comes first and
 * puts width and height at a fixed offset.
 */
function pngSize(png: Buffer): { readonly width: number; height: number } {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

/**
 * Render the same title with one configured font and no system fonts, the way
 * a project pinning its typeface would.
 */
async function renderWithFont(family: string, file: string): Promise<Buffer> {
  const dimensions = { width: 240, height: 120 };
  const config = resolveConfig({ fonts: [{ family, path: file }] });
  const svg = await buildSvg(
    { template: "card", title: "Wg" },
    config,
    dimensions,
  );

  return renderSvgToPng(svg, dimensions, config);
}

describe("buildSvg", () => {
  it("wraps background and template body in a sized svg root", async () => {
    const svg = await buildSvg(
      { template: "banner", title: "hi" },
      resolveConfig(),
      { width: 640, height: 480 },
    );

    assertStringStartsWith(svg, '<svg width="640" height="480"');
    assertStringIncludes(svg, 'viewBox="0 0 640 480"');
    assertStringIncludes(svg, '<linearGradient id="colophon-bg"');
    assertStringIncludes(svg, ">hi</text>");
    assertStringEndsWith(svg, "</svg>");
  });

  it("throws a helpful error for an unknown template", async () => {
    const error = await assertThrowsErrorAsync(async () =>
      buildSvg({ template: "nope", title: "x" }, resolveConfig(), {
        width: 10,
        height: 10,
      }),
    );

    assertStringIncludes(error.message, 'Unknown template "nope"');
    assertStringIncludes(error.message, "banner, card, code");
  });
});

describe("renderSvgToPng", () => {
  it("produces a PNG at the requested size", async () => {
    const svg = await buildSvg(
      { template: "card", title: "x" },
      resolveConfig(),
      { width: 48, height: 24 },
    );
    const png = await renderSvgToPng(svg, { width: 48, height: 24 });

    assertBufferEqual(png.subarray(0, 4), pngSignature);
    assertObjectEquals(pngSize(png), { width: 48, height: 24 });
  }, 5000);

  it("draws text with the configured font rather than an installed one", async () => {
    const [sans, serif, again] = await Promise.all([
      renderWithFont("DejaVu Sans", sansFont),
      renderWithFont("DejaVu Serif", serifFont),
      renderWithFont("DejaVu Sans", sansFont),
    ]);

    // Same props, same size: only the font differs, so different pixels mean
    // the supplied file is what drew the text — the point of configuring one.
    assertFalse(sans.equals(serif));
    assertBufferEqual(sans, again);
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
