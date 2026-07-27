import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  assertArrayEquals,
  assertArrayLength,
  assertBufferEqual,
  assertIdentical,
  assertObjectEquals,
  assertPathExists,
  assertStringIncludes,
  assertThrowsError,
  assertUndefined,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { fallbackFamily, fontFilePaths, resolveFonts } from "./fonts/index.js";

// Real font files, so the tests exercise what a project would actually
// configure. DejaVu is a dev dependency; nothing ships with the package.
const fontDir = path.join(process.cwd(), "node_modules/dejavu-fonts-ttf/ttf");
const sansFont = path.join(fontDir, "DejaVuSans.ttf");
const serifFont = path.join(fontDir, "DejaVuSerif.ttf");

describe("resolveFonts", () => {
  it("returns no fonts when none are configured", () => {
    assertArrayEquals(resolveFonts(undefined), []);
    assertArrayEquals(resolveFonts([]), []);
  });

  it("makes a relative path absolute", () => {
    const relative = path.relative(process.cwd(), sansFont);
    const [font] = resolveFonts([{ family: "DejaVu Sans", path: relative }]);

    assertObjectEquals(font, { family: "DejaVu Sans", path: sansFont });
  });

  it("keeps an absolute path and an omitted family", () => {
    const fonts = resolveFonts([{ path: sansFont }]);

    assertArrayLength(fonts, 1);
    assertObjectEquals(fonts[0], { path: sansFont });
  });

  it("passes font data through untouched", () => {
    const data = new Uint8Array([1, 2, 3]);
    const [font] = resolveFonts([{ family: "Bundled", data }]);

    assertObjectEquals(font, { family: "Bundled", data });
  });

  it("rejects a path that is not there, naming the resolved location", () => {
    const error = assertThrowsError(() =>
      resolveFonts([{ path: sansFont }, { path: "fonts/missing.ttf" }]),
    );

    assertStringIncludes(error.message, "fonts[1]");
    assertStringIncludes(error.message, path.resolve("fonts/missing.ttf"));
  });

  it("rejects a path that is a directory", () => {
    const error = assertThrowsError(() =>
      resolveFonts([{ path: path.dirname(sansFont) }]),
    );

    assertStringIncludes(error.message, "font file not found");
  });

  it("rejects a font with neither a path nor data", () => {
    const error = assertThrowsError(() =>
      resolveFonts([{ family: "Nothing" } as unknown as { path: string }]),
    );

    assertStringIncludes(error.message, 'needs a "path"');
  });

  it("rejects a font with both a path and data", () => {
    const error = assertThrowsError(() =>
      resolveFonts([{ path: sansFont, data: new Uint8Array([1]) }]),
    );

    assertStringIncludes(error.message, 'both "path" and "data"');
  });

  it("rejects empty font data", () => {
    const error = assertThrowsError(() =>
      resolveFonts([{ data: new Uint8Array() }]),
    );

    assertStringIncludes(error.message, "empty font data");
  });
});

describe("fontFilePaths", () => {
  it("returns configured paths in order", async () => {
    const paths = await fontFilePaths([
      { path: sansFont },
      { path: serifFont },
    ]);

    assertArrayEquals(paths, [sansFont, serifFont]);
  });

  it("writes font data to a file the rasteriser can read", async () => {
    const data = await readFile(sansFont);
    const paths = await fontFilePaths([{ family: "DejaVu Sans", data }]);

    assertArrayLength(paths, 1);
    assertPathExists(paths[0]);
    assertBufferEqual(await readFile(paths[0]), data);
  });

  it("reuses one file for identical bytes", async () => {
    const data = await readFile(serifFont);
    const [first] = await fontFilePaths([{ data }]);
    const [second] = await fontFilePaths([{ data: new Uint8Array(data) }]);

    assertIdentical(first, second);
  });
});

describe("fallbackFamily", () => {
  it("takes the first declared family", () => {
    assertIdentical(
      fallbackFamily([
        { path: sansFont },
        { family: "DejaVu Serif", path: serifFont },
      ]),
      "DejaVu Serif",
    );
  });

  it("is undefined when no font declares one", () => {
    assertUndefined(fallbackFamily([{ path: sansFont }]));
    assertUndefined(fallbackFamily([]));
  });
});
