import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { resolveConfig } from "./config.js";
import { buildSvg, renderMetaImages, renderSvgToPng } from "./render.js";

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

describe("buildSvg", () => {
  it("wraps background and template body in a sized svg root", () => {
    const svg = buildSvg({ template: "banner", title: "hi" }, resolveConfig(), {
      width: 640,
      height: 480,
    });

    expect(svg.startsWith('<svg width="640" height="480"')).toBe(true);
    expect(svg).toContain('viewBox="0 0 640 480"');
    expect(svg).toContain('<linearGradient id="colophon-bg"');
    expect(svg).toContain(">hi</text>");
    expect(svg.endsWith("</svg>")).toBe(true);
  });

  it("throws a helpful error for an unknown template", () => {
    expect(() =>
      buildSvg({ template: "nope", title: "x" }, resolveConfig(), {
        width: 10,
        height: 10,
      }),
    ).toThrow(/Unknown template "nope".*banner, card/s);
  });
});

describe("renderSvgToPng", () => {
  it("produces a PNG at the requested size", async () => {
    const svg = buildSvg({ template: "card", title: "x" }, resolveConfig(), {
      width: 48,
      height: 24,
    });
    const png = await renderSvgToPng(svg, { width: 48, height: 24 });

    expect(png.subarray(0, 4)).toStrictEqual(pngSignature);

    const metadata = await sharp(png).metadata();
    expect(metadata.format).toBe("png");
    expect(metadata.width).toBe(48);
    expect(metadata.height).toBe(24);
  }, 5000);
});

describe("renderMetaImages", () => {
  it("renders one PNG per configured dimension", async () => {
    const images = await renderMetaImages(
      { template: "banner", title: "hello", version: "1.0.0" },
      {
        dimensions: [
          { width: 64, height: 64 },
          { width: 48, height: 24 },
        ],
      },
    );

    expect(images).toHaveLength(2);
    expect(images[0]!.dimensions).toStrictEqual({ width: 64, height: 64 });
    expect(images[0]!.svg).toContain(">hello</text>");
    expect(images[0]!.png.subarray(0, 4)).toStrictEqual(pngSignature);
    expect(images[1]!.dimensions).toStrictEqual({ width: 48, height: 24 });
  }, 5000);

  it("rejects before rendering when the template is unknown", async () => {
    await expect(
      renderMetaImages({ template: "missing", title: "x" }),
    ).rejects.toThrow(/Unknown template "missing"/);
  });
});
