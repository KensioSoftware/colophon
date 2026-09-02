/**
 * What the rebuild stamp covers of the package's own rendering code.
 *
 * `RENDER_DIGEST` stands where the package version used to stand in every
 * stamp, and the tests below are the inputs the version was the only cover
 * for. A release that moves any of them has to re-render, and one that moves
 * none of them must leave every image alone.
 */
import {
  assertArrayEquals,
  assertArrayIncludes,
  assertArrayIncludesAll,
  assertIdentical,
  assertStringLength,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { renderDigest, renderInputs } from "../test/render-digest.js";
import { RENDER_DIGEST } from "./stamp/render-digest.js";

describe("the render digest", () => {
  it("is what this source tree computes", () => {
    // The committed module is generated. `pnpm build` rewrites it before it
    // compiles, and `pnpm render-digest` writes it without compiling.
    assertIdentical(RENDER_DIGEST, renderDigest());
  });

  it("is a sha256", () => {
    assertStringLength(RENDER_DIGEST, 64);
  });

  it("covers the modules a built-in template draws with", () => {
    // `articleTemplate.render` calls every one of these, and the
    // `render.toString()` a stamp hashes reaches none of them.
    assertArrayIncludesAll(renderInputs().modules, [
      "src/layout/draw.ts",
      "src/templates/article/bottom.ts",
      "src/templates/article/tags.ts",
      "src/templates/frame.ts",
      "src/templates/logo.ts",
    ]);
  });

  it("covers the machinery outside the templates", () => {
    assertArrayIncludesAll(renderInputs().modules, [
      "src/encode/index.ts",
      "src/layout/index.ts",
      "src/measure/faces.ts",
      "src/render/svg.ts",
      "src/text/wrap.ts",
    ]);
  });

  it("covers the fonts the package bundles", () => {
    // `withBundledFonts` adds these at rasterise time, once `configDigest` has
    // run, and `config.fonts` never holds them for it to hash.
    assertArrayIncludes(renderInputs().fonts, "fonts/Outfit_400Regular.ttf");
  });

  it("covers the libraries that draw, encode, colour and measure", () => {
    // resvg most of all. `config.rasteriser.toString()` sees the wrapper
    // around it and nothing of the library itself.
    assertArrayEquals(renderInputs().packages, [
      "@resvg/resvg-js",
      "@shikijs/themes",
      "fontkit",
      "sharp",
      "shiki",
    ]);
  });

  it("leaves out the code that writes an image rather than draws one", () => {
    // The whole point of #139. A release that only touches the CLI, the
    // manifest or the content walker has to leave the images on disk alone.
    const outside = renderInputs().modules.filter((file) =>
      ["src/cli/", "src/content/", "src/generate/", "src/manifest/"].some(
        (directory) => file.startsWith(directory),
      ),
    );

    assertArrayEquals(outside, []);
  });
});
