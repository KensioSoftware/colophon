import { existsSync } from "node:fs";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ContentFile } from "./content/index.js";
import { defaultOutputPath, generate } from "./generate.js";
import type { GenerateOptions } from "./generate.js";

const tinyDimensions = [
  { width: 32, height: 32 },
  { width: 16, height: 16 },
];

function byPath(a: string, b: string): number {
  return a.localeCompare(b);
}

function options(
  dir: string,
  overrides: Partial<GenerateOptions> = {},
): GenerateOptions {
  return {
    contentDir: dir,
    config: { dimensions: tinyDimensions },
    ...overrides,
  };
}

describe("defaultOutputPath", () => {
  const file: ContentFile = {
    contentPath: path.join("guide", "index.md"),
    absolutePath: path.join("/root", "guide", "index.md"),
    props: { template: "banner", title: "t" },
  };

  it("names index.* after the parent directory, no suffix for the first size", () => {
    expect(defaultOutputPath(file, { width: 1200, height: 1200 }, 0)).toBe(
      path.join("/root", "guide", "guide.png"),
    );
  });

  it("adds a WxH suffix for additional sizes", () => {
    expect(defaultOutputPath(file, { width: 1200, height: 630 }, 1)).toBe(
      path.join("/root", "guide", "guide-1200x630.png"),
    );
  });

  it("names non-index files after the file itself", () => {
    const post: ContentFile = {
      contentPath: "hello.md",
      absolutePath: path.join("/root", "hello.md"),
      props: { template: "banner", title: "t" },
    };

    expect(defaultOutputPath(post, { width: 1, height: 1 }, 0)).toBe(
      path.join("/root", "hello.png"),
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

  it("writes one PNG per dimension next to the content file", async () => {
    const results = await generate(options(dir));

    expect(results).toHaveLength(2);
    expect(results.every((result) => !result.skipped)).toBe(true);

    const square = path.join(dir, "guide", "guide.png");
    const small = path.join(dir, "guide", "guide-16x16.png");
    expect(existsSync(square)).toBe(true);
    expect(existsSync(small)).toBe(true);
    expect(results[0]!.outputPath).toBe(square);
  }, 5000);

  it("skips existing files and does not overwrite them", async () => {
    const target = path.join(dir, "guide", "guide.png");
    await writeFile(target, "sentinel");

    const results = await generate(options(dir));
    const squareResult = results.find((result) => result.outputPath === target);

    expect(squareResult?.skipped).toBe(true);
    expect(await readFile(target, "utf8")).toBe("sentinel");
  }, 5000);

  it("re-renders when overwrite is set", async () => {
    const target = path.join(dir, "guide", "guide.png");
    await writeFile(target, "sentinel");

    const results = await generate(options(dir, { overwrite: true }));
    const squareResult = results.find((result) => result.outputPath === target);

    expect(squareResult?.skipped).toBe(false);
    expect(await readFile(target, "utf8")).not.toBe("sentinel");
  }, 5000);

  it("uses a custom output path and reports each result", async () => {
    const seen: string[] = [];
    const outDir = path.join(dir, "out");

    const results = await generate(
      options(dir, {
        outputPath: (file, dimensions) =>
          path.join(
            outDir,
            `${path.basename(path.dirname(file.absolutePath))}-${String(dimensions.width)}.png`,
          ),
        onResult: (result) => {
          seen.push(result.outputPath);
        },
      }),
    );

    expect(existsSync(path.join(outDir, "guide-32.png"))).toBe(true);
    expect(seen.toSorted(byPath)).toStrictEqual(
      results.map((result) => result.outputPath).toSorted(byPath),
    );
  }, 5000);
});
