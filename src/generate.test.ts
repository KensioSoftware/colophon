import { existsSync } from "node:fs";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ContentFile } from "./content/index.js";
import { defaultOutputPath, generate } from "./generate.js";
import type { GenerateOptions } from "./generate.js";
import type { OutputSize } from "./types.js";

const tinySizes: OutputSize[] = [
  { name: "og", width: 32, height: 32 },
  { name: "square", width: 16, height: 16 },
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
    expect(
      defaultOutputPath(file, { name: "og", width: 1200, height: 630 }),
    ).toBe(path.join("/root", "guide", "getting-started-guide-og.png"));
  });

  it("gives each size a distinct filename", () => {
    const square = defaultOutputPath(file, {
      name: "square",
      width: 1200,
      height: 1200,
    });
    const og = defaultOutputPath(file, {
      name: "og",
      width: 1200,
      height: 630,
    });

    expect(square).not.toBe(og);
    expect(square.endsWith("getting-started-guide-square.png")).toBe(true);
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

    expect(results).toHaveLength(2);
    expect(results.every((result) => !result.skipped)).toBe(true);

    // `guide/index.md` has no frontmatter slug, so the slug is the directory.
    const og = path.join(dir, "guide", "guide-og.png");
    const square = path.join(dir, "guide", "guide-square.png");
    expect(existsSync(og)).toBe(true);
    expect(existsSync(square)).toBe(true);
    expect(results[0]!.outputPath).toBe(og);
    expect(results[0]!.size.name).toBe("og");
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

    expect(slugged).toHaveLength(2);
    expect(existsSync(path.join(dir, "post", "keyword-rich-slug-og.png"))).toBe(
      true,
    );
  }, 5000);

  it("skips existing files and does not overwrite them", async () => {
    const target = path.join(dir, "guide", "guide-og.png");
    await writeFile(target, "sentinel");

    const results = await generate(options(dir));
    const ogResult = results.find((result) => result.outputPath === target);

    expect(ogResult?.skipped).toBe(true);
    expect(await readFile(target, "utf8")).toBe("sentinel");
  }, 5000);

  it("re-renders when overwrite is set", async () => {
    const target = path.join(dir, "guide", "guide-og.png");
    await writeFile(target, "sentinel");

    const results = await generate(options(dir, { overwrite: true }));
    const ogResult = results.find((result) => result.outputPath === target);

    expect(ogResult?.skipped).toBe(false);
    expect(await readFile(target, "utf8")).not.toBe("sentinel");
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

    expect(existsSync(path.join(outDir, "guide.og.png"))).toBe(true);
    expect(seen.toSorted(byPath)).toStrictEqual(
      results.map((result) => result.outputPath).toSorted(byPath),
    );
  }, 5000);
});
