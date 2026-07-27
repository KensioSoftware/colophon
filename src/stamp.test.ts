import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { crc32 } from "node:zlib";

import {
  assertArrayIncludes,
  assertIdentical,
  assertThrowsError,
  assertTrue,
  assertUndefined,
} from "@kensio/smartass";
import { afterEach, beforeEach, describe, it } from "vitest";

import { resolveConfig } from "./config/index.js";
import { renderSvgToPng } from "./render/index.js";
import { createStamper, readPngStamp, stampPng } from "./stamp/index.js";
import type { ColophonConfig, MetaImageProps, OutputSize } from "./types.js";

const og: OutputSize = { name: "og", width: 32, height: 16 };
const square: OutputSize = { name: "square", width: 16, height: 16 };

const props: MetaImageProps = { template: "banner", title: "Guide" };

// DejaVu is a dev dependency; nothing ships with the package.
const sansFont = path.join(
  process.cwd(),
  "node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf",
);

async function tinyPng(): Promise<Buffer> {
  return renderSvgToPng(
    '<svg width="4" height="4" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="4" height="4" fill="#123456"/></svg>',
    { width: 4, height: 4 },
  );
}

async function stampFor(
  config: ColophonConfig,
  overrides: Partial<MetaImageProps> = {},
  size: OutputSize = og,
): Promise<string> {
  const stamper = await createStamper(resolveConfig(config));
  return stamper.stamp({ ...props, ...overrides }, size);
}

/** Assert two stamps differ, i.e. that the image would be rendered again. */
function assertRestamped(a: string, b: string): void {
  assertTrue(a !== b, "expected the stamp to change");
}

/**
 * The type of every chunk in a PNG, checking each one's CRC on the way. A
 * stamped image is then verified as still structurally valid, rather than
 * merely as still starting with a PNG signature.
 */
function chunkTypes(png: Buffer): string[] {
  const types: string[] = [];
  let offset = 8;

  while (offset + 8 <= png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("latin1", offset + 4, offset + 8);
    const end = offset + 8 + length;

    assertTrue(end + 4 <= png.length, `chunk ${type} runs past the end`);
    assertIdentical(
      png.readUInt32BE(end),
      crc32(png.subarray(offset + 4, end)),
      `bad CRC on chunk ${type}`,
    );

    types.push(type);
    offset = end + 4;
  }

  return types;
}

describe("createStamper", () => {
  it("gives the same stamp for the same props, config and size", async () => {
    assertIdentical(await stampFor({}), await stampFor({}));
  });

  it("changes the stamp when a prop changes", async () => {
    assertRestamped(await stampFor({}), await stampFor({}, { title: "Post" }));
  });

  it("ignores the order frontmatter keys came in", async () => {
    const stamper = await createStamper(resolveConfig({}));

    assertIdentical(
      stamper.stamp({ template: "banner", title: "a", subtitle: "b" }, og),
      stamper.stamp({ subtitle: "b", title: "a", template: "banner" }, og),
    );
  });

  it("changes the stamp when the config changes", async () => {
    assertRestamped(
      await stampFor({ colors: { brand: "#ff0000" } }),
      await stampFor({ colors: { brand: "#00ff00" } }),
    );
  });

  it("changes the stamp when the size changes", async () => {
    assertRestamped(await stampFor({}, {}, og), await stampFor({}, {}, square));
  });

  it("changes the stamp when the template's own code changes", async () => {
    const before: ColophonConfig = {
      templates: { custom: { name: "custom", render: () => "<g/>" } },
    };
    const after: ColophonConfig = {
      templates: { custom: { name: "custom", render: () => "<g id='x'/>" } },
    };

    assertRestamped(
      await stampFor(before, { template: "custom" }),
      await stampFor(after, { template: "custom" }),
    );
  });

  it("changes the stamp when a size's own overrides change", async () => {
    // The whole point of #19 meeting the stamp: an override is config, so
    // changing one has to re-render that image and not the others.
    assertRestamped(
      await stampFor({}, {}, { ...og, code: { minFontScale: 0.02 } }),
      await stampFor({}, {}, { ...og, code: { minFontScale: 0.011 } }),
    );
  });

  it("changes the stamp when a size gains overrides", async () => {
    assertRestamped(
      await stampFor({}, {}, og),
      await stampFor({}, {}, { ...og, footer: "example.com" }),
    );
  });

  it("leaves one size's stamp alone when another's overrides change", async () => {
    const before: ColophonConfig = {
      sizes: [og, { ...square, code: { minFontScale: 0.02 } }],
    };
    const after: ColophonConfig = {
      sizes: [og, { ...square, code: { minFontScale: 0.011 } }],
    };

    assertIdentical(
      await stampFor(before, {}, og),
      await stampFor(after, {}, og),
    );
  });

  it("leaves images alone when an unrelated template or size is added", async () => {
    const extra: ColophonConfig = {
      sizes: [og, square, { name: "wide", width: 64, height: 16 }],
      templates: { custom: { name: "custom", render: () => "<g/>" } },
    };

    assertIdentical(await stampFor({}), await stampFor(extra));
  });

  it("changes the stamp when a configured font's contents change", async () => {
    const bytes = await readFile(sansFont);

    assertRestamped(
      await stampFor({ fonts: [{ family: "DejaVu Sans", data: bytes }] }),
      await stampFor({
        fonts: [{ family: "DejaVu Sans", data: bytes.subarray(0, -1) }],
      }),
    );
  });

  it("follows a font file's contents rather than its path", async () => {
    const bytes = await readFile(sansFont);

    assertIdentical(
      await stampFor({ fonts: [{ family: "DejaVu Sans", path: sansFont }] }),
      await stampFor({ fonts: [{ family: "DejaVu Sans", data: bytes }] }),
    );
  });

  it("does not depend on where warnings go", async () => {
    assertIdentical(
      await stampFor({}),
      await stampFor({
        onWarning: () => {
          /* silenced */
        },
      }),
    );
  });
});

describe("stampPng", () => {
  it("embeds a stamp that reads back, leaving the image valid", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "colophon-stamp-"));

    try {
      const stamp = await stampFor({});
      const file = path.join(dir, "stamped.png");
      const stamped = stampPng(await tinyPng(), stamp);
      await writeFile(file, stamped);

      const types = chunkTypes(stamped);
      assertIdentical(types[0], "IHDR");
      assertIdentical(types[1], "tEXt");
      assertArrayIncludes(types, "IDAT");
      assertIdentical(types.at(-1), "IEND");
      assertIdentical(await readPngStamp(file), stamp);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 10_000);

  it("refuses anything that is not a PNG", () => {
    const error = assertThrowsError(() => {
      stampPng(Buffer.from("not a png, but long enough to look at"), "x");
    });

    assertIdentical(error.message, "Cannot stamp: not a PNG image.");
  });
});

describe("readPngStamp", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "colophon-stamp-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("returns undefined for a file that is not there", async () => {
    assertUndefined(await readPngStamp(path.join(dir, "missing.png")));
  });

  it("returns undefined for a file that is not a PNG", async () => {
    const file = path.join(dir, "not-a.png");
    await writeFile(file, "sentinel");

    assertUndefined(await readPngStamp(file));
  });

  it("returns undefined for an unstamped PNG", async () => {
    const file = path.join(dir, "plain.png");
    await writeFile(file, await tinyPng());

    assertUndefined(await readPngStamp(file));
  }, 10_000);
});
