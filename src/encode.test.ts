/**
 * Writing a format other than PNG: what comes out, how big it is, and what a
 * build says when a cap cannot be met.
 *
 * The pictures are decoded again rather than trusted from their signature,
 * because a file with the right magic bytes and nothing behind them is exactly
 * the failure a signature check cannot see.
 */
import {
  assertArrayLength,
  assertBufferEqual,
  assertIdentical,
  assertStringIncludes,
  assertThrowsError,
  assertThrowsErrorAsync,
  assertTrue,
} from "@kensio/smartass";
import sharp from "sharp";
import { describe, it } from "vitest";

import { resolveConfig } from "./config/index.js";
import { extensionFor, mediaTypeFor, withExtension } from "./encode/index.js";
import { renderSvgToImage } from "./render/index.js";
import type { ColophonConfig, OutputFormat } from "./types.js";

/**
 * A gradient with a few shapes over it, which is what a meta image mostly is
 * and what the lossy encoders have real work to do on. A flat fill would come
 * out the same size at every quality and so say nothing about any of them.
 */
const busySvg =
  '<svg width="400" height="240" xmlns="http://www.w3.org/2000/svg">' +
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0%" stop-color="#3730a3"/>' +
  '<stop offset="100%" stop-color="#db2777"/></linearGradient></defs>' +
  '<rect width="400" height="240" fill="url(#g)"/>' +
  '<circle cx="140" cy="100" r="68" fill="#f59e0b" opacity="0.7"/>' +
  '<path d="M240 240 L340 40 L400 240 Z" fill="#065f46"/>' +
  "</svg>";

const dimensions = { width: 400, height: 240 };

/** One rendering, through the whole rasterise-and-encode path a build takes. */
async function render(config: ColophonConfig): Promise<Buffer> {
  return renderSvgToImage(busySvg, dimensions, resolveConfig(config));
}

const lossy: readonly OutputFormat[] = ["jpeg", "webp", "avif"];

describe("output format", () => {
  it("writes PNG when nothing asks otherwise", async () => {
    const { mediaType } = await sharp(await render({})).metadata();

    assertIdentical(mediaType, "image/png");
  });

  for (const format of lossy) {
    it(`writes the rendered picture as ${format}`, async () => {
      // Not a pixel comparison, since these are lossy. The dimensions are what
      // says the file holds the rendered image rather than merely being valid.
      const { mediaType, width, height } = await sharp(
        await render({ format }),
      ).metadata();

      assertIdentical(mediaType, mediaTypeFor(format));
      assertIdentical(width, dimensions.width);
      assertIdentical(height, dimensions.height);
    });
  }

  it("is smaller than the PNG it was encoded from", async () => {
    const png = await render({});
    const webp = await render({ format: "webp" });

    assertTrue(
      webp.length < png.length,
      `expected webp to beat png; ${String(webp.length)} vs ${String(png.length)}`,
    );
  });
});

describe("quality", () => {
  it("trades size for it", async () => {
    const low = await render({ format: "jpeg", quality: 20 });
    const high = await render({ format: "jpeg", quality: 95 });

    assertTrue(
      low.length < high.length,
      `expected 20 to beat 95; ${String(low.length)} vs ${String(high.length)}`,
    );
  });

  it("is rejected outside 1 to 100", () => {
    const error = assertThrowsError(() => resolveConfig({ quality: 101 }));

    assertStringIncludes(error.message, "Invalid quality 101");
  });
});

describe("maxBytes", () => {
  it("steps quality down until the image fits", async () => {
    const full = await render({ format: "webp", quality: 90 });
    const cap = Math.round(full.length * 0.6);

    const capped = await render({ format: "webp", quality: 90, maxBytes: cap });

    assertTrue(
      capped.length <= cap,
      `expected ${String(capped.length)} under the ${String(cap)} cap`,
    );
  });

  it("leaves an image that already fits alone", async () => {
    const settings: ColophonConfig = { format: "webp", quality: 90 };
    const full = await render(settings);
    const capped = await render({ ...settings, maxBytes: 1_000_000 });

    assertBufferEqual(capped, full);
  });

  it("writes the image anyway when it will not fit, and says so", async () => {
    const warnings: string[] = [];

    const image = await render({
      format: "avif",
      maxBytes: 200,
      onWarning: (message) => {
        warnings.push(message);
      },
    });

    const size = image.length;
    assertTrue(size > 200, `expected ${String(size)} to exceed the 200B cap`);
    assertArrayLength(warnings, 1);
    assertStringIncludes(warnings[0], "over the 0KB maxBytes cap");
    assertStringIncludes(warnings[0], "Quality was stepped down to 30");
  });

  it("says PNG has nothing to step down", async () => {
    const warnings: string[] = [];

    await render({
      maxBytes: 200,
      onWarning: (message) => {
        warnings.push(message);
      },
    });

    assertArrayLength(warnings, 1);
    assertStringIncludes(warnings[0], "PNG is lossless");
  });

  it("is rejected at zero, which nothing could ever meet", () => {
    const error = assertThrowsError(() => resolveConfig({ maxBytes: 0 }));

    assertStringIncludes(error.message, "Invalid maxBytes 0");
  });
});

describe("bytes already in the configured format", () => {
  it("are handed on rather than encoded again", async () => {
    // A rasteriser returning WebP under `format: "webp"` has already done the
    // job, and a second pass would cost the picture a generation for nothing.
    const webp = await render({ format: "webp" });

    const image = await renderSvgToImage(
      busySvg,
      dimensions,
      resolveConfig({ format: "webp", rasteriser: () => webp }),
    );

    assertBufferEqual(image, webp);
  });
});

describe("bytes no encoder reads", () => {
  it("say which config asked for them to be encoded", async () => {
    const error = await assertThrowsErrorAsync(async () =>
      renderSvgToImage(
        busySvg,
        dimensions,
        resolveConfig({ format: "webp", rasteriser: () => Buffer.from("no") }),
      ),
    );

    assertStringIncludes(error.message, "Cannot encode the rendered image");
    assertStringIncludes(error.message, "config.format to png");
  });
});

describe("naming", () => {
  it("gives each format its own extension", () => {
    assertIdentical(extensionFor("png"), ".png");
    assertIdentical(extensionFor("jpeg"), ".jpg");
    assertIdentical(extensionFor("webp"), ".webp");
    assertIdentical(extensionFor("avif"), ".avif");
  });

  it("replaces the last extension and keeps a hash", () => {
    assertIdentical(withExtension("a/post-og.webp", ".svg"), "a/post-og.svg");
    assertIdentical(
      withExtension("a/post-og.ecd0aab2.webp", ".svg"),
      "a/post-og.ecd0aab2.svg",
    );
  });

  it("appends where there is no extension to replace", () => {
    assertIdentical(withExtension("a.b/image", ".svg"), "a.b/image.svg");
  });
});
