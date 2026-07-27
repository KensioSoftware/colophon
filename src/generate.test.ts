import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  assertArrayEquals,
  assertArrayLength,
  assertBufferEqual,
  assertFalse,
  assertFileEquals,
  assertFileExists,
  assertIdentical,
  assertNonNullable,
  assertStringIncludes,
  assertTrue,
} from "@kensio/smartass";
import { afterEach, beforeEach, describe, it } from "vitest";

import type { ContentFile } from "./content/index.js";
import { defaultOutputPath, generate } from "./generate.js";
import type { GenerateOptions } from "./generate.js";
import type { OutputSize } from "./types.js";

const tinySizes: OutputSize[] = [
  { name: "og", width: 32, height: 32 },
  { name: "square", width: 16, height: 16 },
];

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

function byPath(a: string, b: string): number {
  return a.localeCompare(b);
}

function options(
  dir: string,
  overrides: Partial<GenerateOptions> = {},
): GenerateOptions {
  return {
    contentDir: dir,
    config: { sizes: tinySizes },
    ...overrides,
  };
}

describe("defaultOutputPath", () => {
  const file: ContentFile = {
    contentPath: path.join("guide", "index.md"),
    absolutePath: path.join("/root", "guide", "index.md"),
    slug: "getting-started-guide",
    props: { template: "banner", title: "t" },
  };

  it("names files <slug>-<size>.png next to the content file", () => {
    assertIdentical(
      defaultOutputPath(file, { name: "og", width: 1200, height: 630 }),
      path.join("/root", "guide", "getting-started-guide-og.png"),
    );
  });

  it("gives each size a distinct filename", () => {
    assertIdentical(
      defaultOutputPath(file, { name: "square", width: 1200, height: 1200 }),
      path.join("/root", "guide", "getting-started-guide-square.png"),
    );
    assertIdentical(
      defaultOutputPath(file, { name: "og", width: 1200, height: 630 }),
      path.join("/root", "guide", "getting-started-guide-og.png"),
    );
  });
});

describe("generate", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "colophon-gen-"));
    await mkdir(path.join(dir, "guide"), { recursive: true });
    await writeFile(
      path.join(dir, "guide", "index.md"),
      "---\nmeta_img_props:\n  template: banner\n  title: Guide\n---\n",
    );
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("writes one distinctly-named PNG per size next to the content file", async () => {
    const results = await generate(options(dir));

    assertArrayLength(results, 2);
    assertTrue(results.every((result) => !result.skipped));

    // `guide/index.md` has no frontmatter slug, so the slug is the directory.
    const og = path.join(dir, "guide", "guide-og.png");
    const square = path.join(dir, "guide", "guide-square.png");
    assertFileExists(og);
    assertFileExists(square);
    assertIdentical(results[0].outputPath, og);
    assertIdentical(results[0].size.name, "og");
  }, 5000);

  it("uses a frontmatter slug as the base filename", async () => {
    await mkdir(path.join(dir, "post"), { recursive: true });
    await writeFile(
      path.join(dir, "post", "index.md"),
      "---\nslug: keyword-rich-slug\nmeta_img_props:\n  template: card\n  title: Post\n---\n",
    );

    const results = await generate(options(dir));
    const slugged = results.filter((result) =>
      result.outputPath.includes("keyword-rich-slug"),
    );

    assertArrayLength(slugged, 2);
    assertFileExists(path.join(dir, "post", "keyword-rich-slug-og.png"));
  }, 5000);

  it("skips existing files and does not overwrite them", async () => {
    const target = path.join(dir, "guide", "guide-og.png");
    await writeFile(target, "sentinel");

    const results = await generate(options(dir));
    const ogResult = results.find((result) => result.outputPath === target);

    assertNonNullable(ogResult);
    assertTrue(ogResult.skipped);
    assertFileEquals(target, "sentinel");
  }, 5000);

  it("re-renders when overwrite is set", async () => {
    const target = path.join(dir, "guide", "guide-og.png");
    await writeFile(target, "sentinel");

    const results = await generate(options(dir, { overwrite: true }));
    const ogResult = results.find((result) => result.outputPath === target);

    assertNonNullable(ogResult);
    assertFalse(ogResult.skipped);
    // The sentinel is gone, replaced by a real PNG.
    const written = await readFile(target);
    assertBufferEqual(written.subarray(0, 4), pngSignature);
  }, 5000);

  it("names the content file in a template's warnings", async () => {
    const warnings: string[] = [];
    await mkdir(path.join(dir, "snippet"), { recursive: true });
    await writeFile(
      path.join(dir, "snippet", "index.md"),
      "---\nmeta_img_props:\n  template: code\n  language: text\n" +
        `  code: |\n    ${"x".repeat(200)}\n---\n`,
    );

    await generate(
      options(dir, {
        config: {
          sizes: tinySizes.slice(0, 1),
          onWarning: (message) => {
            warnings.push(message);
          },
        },
      }),
    );

    assertArrayLength(warnings, 1);
    assertStringIncludes(
      warnings[0],
      `${path.join("snippet", "index.md")}: code snippet does not fit`,
    );
  }, 5000);

  it("uses a custom output path and reports each result", async () => {
    const seen: string[] = [];
    const outDir = path.join(dir, "out");

    const results = await generate(
      options(dir, {
        outputPath: (file, size) =>
          path.join(outDir, `${file.slug}.${size.name}.png`),
        onResult: (result) => {
          seen.push(result.outputPath);
        },
      }),
    );

    assertFileExists(path.join(outDir, "guide.og.png"));
    assertArrayEquals(
      seen.toSorted(byPath),
      results.map((result) => result.outputPath).toSorted(byPath),
    );
  }, 5000);
});
