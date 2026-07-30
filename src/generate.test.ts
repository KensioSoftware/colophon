import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import {
  assertArrayEquals,
  assertArrayLength,
  assertBufferEqual,
  assertFalse,
  assertFileExists,
  assertIdentical,
  assertNonNullable,
  assertNumberBetween,
  assertObjectMatches,
  assertPathNotExists,
  assertSetSize,
  assertStringIncludes,
  assertStringLength,
  assertThrowsErrorAsync,
  assertTrue,
  assertUndefined,
} from "@kensio/smartass";
import { afterEach, beforeEach, describe, it } from "vitest";

import type { ContentFile } from "./content/index.js";
import { readPngStamp } from "./stamp/index.js";
import { defaultOutputPath, generate } from "./generate/index.js";
import type { GenerateOptions } from "./generate/index.js";
import type { ExtraImage, Manifest, OutputSize } from "./types.js";

const tinyOg: OutputSize = { name: "og", width: 32, height: 32 };
const tinySquare: OutputSize = { name: "square", width: 16, height: 16 };
const tinySizes: OutputSize[] = [tinyOg, tinySquare];

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

// A committed sample, used where a test needs real PNG bytes it did not render.
const samplePng = path.join(process.cwd(), "docs/samples/card-wide-solid.png");

async function readManifest(file: string): Promise<Manifest> {
  return JSON.parse(await readFile(file, "utf8")) as Manifest;
}

function byPath(a: string, b: string): number {
  return a.localeCompare(b);
}

/** An extra image rendering at the og size with a brand colour of its own. */
function cardBrand(color: string): Partial<ExtraImage> {
  return { size: { ...tinyOg, colors: { brand: color } } };
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

  it("writes a route slug from the content root, not beside the file", () => {
    const routed: ContentFile = {
      contentPath: path.join("services", "iam", "index.md"),
      absolutePath: path.join("/root", "services", "iam", "index.md"),
      slug: "services/iam",
      props: { template: "card" },
    };

    // Beside the file would be `/root/services/iam/services/iam-og.png`, with
    // the slug's own directories repeated.
    assertIdentical(
      defaultOutputPath(routed, { name: "og", width: 1200, height: 630 }),
      path.join("/root", "services", "iam-og.png"),
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
  let target: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "colophon-gen-"));
    target = path.join(dir, "guide", "guide-og.png");
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

  it("skips images it has already rendered from the same input", async () => {
    await generate(options(dir));
    const first = await readFile(target);

    const results = await generate(options(dir));
    const ogResult = results.find((result) => result.outputPath === target);

    assertNonNullable(ogResult);
    assertTrue(ogResult.skipped);
    assertBufferEqual(await readFile(target), first);
  }, 10_000);

  it("re-renders when the props change", async () => {
    await generate(options(dir));
    await writeFile(
      path.join(dir, "guide", "index.md"),
      "---\nmeta_img_props:\n  template: banner\n  title: Corrected\n---\n",
    );

    const results = await generate(options(dir));

    assertTrue(results.every((result) => !result.skipped));
  }, 10_000);

  it("re-renders when the config changes", async () => {
    await generate(options(dir, { config: { sizes: tinySizes } }));

    const results = await generate(
      options(dir, {
        config: { sizes: tinySizes, colors: { brand: "#0d9488" } },
      }),
    );

    assertTrue(results.every((result) => !result.skipped));
  }, 10_000);

  it("writes the bytes a configured rasteriser produced", async () => {
    // A committed sample stands in for another backend's output. It is 1200
    // across and the job asks for 32, so the size on disk is what says which
    // one drew it: the seam is under `generate` and not only under the render
    // core.
    const stub = await readFile(samplePng);
    const results = await generate(
      options(dir, { config: { sizes: [tinyOg], rasteriser: () => stub } }),
    );

    assertArrayLength(results, 1);
    const written = await readFile(results[0].outputPath);
    assertIdentical(written.readUInt32BE(16), 1200);
    // Still stamped, so the build can still skip it next time.
    assertNonNullable(await readPngStamp(results[0].outputPath));
  }, 5000);

  it("fails when a rasteriser produces something other than PNG", async () => {
    // The rebuild stamp is a PNG chunk, so a build cannot write what it cannot
    // stamp. Worth pinning: it is the one constraint on a custom backend, and
    // the thing standing between the seam and other output formats.
    const error = await assertThrowsErrorAsync(async () =>
      generate(
        options(dir, {
          config: { sizes: [tinyOg], rasteriser: () => Buffer.from("webp?") },
        }),
      ),
    );

    assertStringIncludes(error.message, "not a PNG image");
  }, 5000);

  it("replaces an existing image it cannot recognise", async () => {
    await writeFile(target, "sentinel");

    const results = await generate(options(dir));
    const ogResult = results.find((result) => result.outputPath === target);

    assertNonNullable(ogResult);
    assertFalse(ogResult.skipped);
    // The sentinel is gone, replaced by a real PNG.
    const written = await readFile(target);
    assertBufferEqual(written.subarray(0, 4), pngSignature);
  }, 5000);

  /** The og size overriding the config-level brand, and nothing else. */
  function withOgBrand(brand: string): GenerateOptions {
    return options(dir, {
      config: {
        colors: { brand: "#0d9488" },
        sizes: [{ ...tinyOg, colors: { brand } }, tinySquare],
      },
    });
  }

  it("re-renders only the size whose overrides changed", async () => {
    await generate(withOgBrand("#2563eb"));
    const results = await generate(withOgBrand("#dc2626"));

    const og = results.find((result) => result.size.name === "og");
    const square = results.find((result) => result.size.name === "square");

    assertNonNullable(og);
    assertNonNullable(square);
    // Only og's own override moved, so only og is worth rendering again.
    assertFalse(og.skipped);
    assertTrue(square.skipped);
  }, 10_000);

  it("re-renders unchanged images when overwrite is set", async () => {
    await generate(options(dir));

    const results = await generate(options(dir, { overwrite: true }));

    assertTrue(results.every((result) => !result.skipped));
  }, 10_000);

  it("reports what a dry run would write, and writes none of it", async () => {
    const results = await generate(options(dir, { dryRun: true }));

    assertArrayLength(results, 2);
    assertTrue(results.every((result) => !result.skipped));
    assertPathNotExists(results.map((result) => result.outputPath));
  });

  it("reports an up-to-date image as skipped in a dry run", async () => {
    await generate(options(dir));

    const results = await generate(options(dir, { dryRun: true }));

    // What a real build would do, which is the whole question a dry run asks.
    assertTrue(results.every((result) => result.skipped));
  }, 10_000);

  it("writes no manifest in a dry run", async () => {
    const { manifest, options: withIt } = withManifest({ dryRun: true });

    await generate(withIt);

    assertPathNotExists(manifest);
  });

  it("still refuses a config that could not be built, in a dry run", async () => {
    const card = path.join(dir, "npm.png");
    const image: ExtraImage = {
      props: { template: "banner", title: "@kensio/colophon" },
      output: card,
    };

    const error = await assertThrowsErrorAsync(async () =>
      generate(
        options(dir, {
          dryRun: true,
          config: { sizes: [tinyOg], extra: [image, image] },
        }),
      ),
    );

    // Every check a real build makes still runs, which is half the point of
    // asking what a build would do.
    assertStringIncludes(error.message, "Two images would be written to");
  });

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

  it("renders no more images at once than the concurrency allows", async () => {
    let inFlight = 0;
    let peak = 0;
    await Promise.all(
      ["one", "two", "three"].map(async (name) => {
        await mkdir(path.join(dir, name), { recursive: true });
        await writeFile(
          path.join(dir, name, "index.md"),
          `---\nmeta_img_props:\n  template: counted\n  title: ${name}\n---\n`,
        );
      }),
    );

    // Six jobs (three posts, two sizes) through a template that holds each
    // render open long enough for the others to pile up behind it.
    const results = await generate(
      options(dir, {
        concurrency: 2,
        config: {
          sizes: tinySizes,
          templates: {
            counted: {
              name: "counted",
              render: async () => {
                inFlight += 1;
                peak = Math.max(peak, inFlight);
                await delay(5);
                inFlight -= 1;
                return "";
              },
            },
          },
        },
      }),
    );

    // Eight images: the six counted ones plus the shared banner fixture.
    assertArrayLength(results, 8);
    assertNumberBetween(peak, 1, 2);
  }, 10_000);

  it("rejects a concurrency that is not a positive integer", async () => {
    const error = await assertThrowsErrorAsync(async () =>
      generate(options(dir, { concurrency: 0 })),
    );

    assertStringIncludes(error.message, "expected a positive integer");
  });

  it("takes content options from the config module", async () => {
    // The route a CLI user has to the walker: the config module, since a props
    // mapper cannot be passed as a flag.
    await writeFile(
      path.join(dir, "guide", "existing.md"),
      "---\ntitle: Existing\ndescription: No props block here\n---\n",
    );

    const results = await generate(
      options(dir, {
        config: {
          sizes: [tinyOg],
          content: {
            defaultTemplate: "banner",
            props: (frontmatter) => ({
              title: frontmatter["title"],
              subtitle: frontmatter["description"],
            }),
          },
        },
      }),
    );

    assertFileExists(path.join(dir, "guide", "existing-og.png"));
    assertArrayLength(results, 2);
  }, 10_000);

  it("lets walk options override the config's content options", async () => {
    await writeFile(
      path.join(dir, "guide", "other.md"),
      "---\nog:\n  title: From og\n---\n",
    );

    const results = await generate(
      options(dir, {
        config: {
          sizes: [tinyOg],
          content: { propsKey: "meta_img_props" },
        },
        walk: { propsKey: "og", defaultTemplate: "card" },
      }),
    );

    // `walk` won, so the `og` key was read and `guide/index.md` (which uses
    // `meta_img_props`) was not.
    assertArrayLength(results, 1);
    assertFileExists(path.join(dir, "guide", "other-og.png"));
  }, 10_000);

  /** A config declaring one ad hoc card, written wherever `output` says. */
  function withExtra(
    output: string,
    extra: Partial<ExtraImage> = {},
  ): GenerateOptions {
    return options(dir, {
      config: {
        sizes: [tinyOg],
        extra: [
          {
            props: { template: "banner", title: "@kensio/colophon" },
            output,
            ...extra,
          },
        ],
      },
    });
  }

  it("renders an image the config declares outright", async () => {
    const card = path.join(dir, "cards", "npm.png");

    const results = await generate(withExtra(card));
    const extra = results.find((result) => result.outputPath === card);

    assertNonNullable(extra);
    assertFalse(extra.skipped);
    assertFileExists(card);
    // Nothing in the tree produced it, so there is no post to name.
    assertUndefined(extra.contentPath);
    // The tree's own image is still rendered alongside it.
    assertArrayLength(results, 2);
  }, 5000);

  it("renders an extra image at the first configured size by default", async () => {
    const results = await generate(withExtra(path.join(dir, "npm.png")));
    const extra = results.find((result) => result.contentPath === undefined);

    assertNonNullable(extra);
    const { size } = extra;
    assertIdentical(size, tinyOg);
  }, 5000);

  it("renders an extra image at a size of its own", async () => {
    const results = await generate(
      withExtra(path.join(dir, "npm.png"), { size: tinySquare }),
    );
    const extra = results.find((result) => result.contentPath === undefined);

    assertNonNullable(extra);
    const { size } = extra;
    assertIdentical(size, tinySquare);
  }, 5000);

  it("skips an extra image it has already rendered", async () => {
    const card = path.join(dir, "npm.png");
    await generate(withExtra(card));
    const first = await readFile(card);

    const results = await generate(withExtra(card));
    const extra = results.find((result) => result.outputPath === card);

    assertNonNullable(extra);
    assertTrue(extra.skipped);
    assertBufferEqual(await readFile(card), first);
  }, 10_000);

  it("re-renders an extra image when its own overrides change", async () => {
    const card = path.join(dir, "npm.png");

    await generate(withExtra(card, cardBrand("#2563eb")));
    const results = await generate(withExtra(card, cardBrand("#dc2626")));

    const extra = results.find((result) => result.outputPath === card);
    const post = results.find((result) => result.contentPath !== undefined);

    assertNonNullable(extra);
    assertNonNullable(post);
    // The card's own palette moved; the post's did not.
    assertFalse(extra.skipped);
    assertTrue(post.skipped);
  }, 10_000);

  it("rejects an extra image with nowhere to write it", async () => {
    const error = await assertThrowsErrorAsync(async () =>
      // A config module is plain JavaScript, so this reaches `generate`.
      generate(withExtra(undefined as unknown as string)),
    );

    assertStringIncludes(error.message, 'extra[0] needs an "output" path');
  });

  it("rejects an extra image with nothing to draw", async () => {
    const error = await assertThrowsErrorAsync(async () =>
      generate(
        options(dir, {
          config: {
            sizes: [tinyOg],
            extra: [{ output: "card.png" } as unknown as ExtraImage],
          },
        }),
      ),
    );

    assertStringIncludes(error.message, 'extra[0] needs a "props" object');
  });

  it("rejects two images written to the same path", async () => {
    const card = path.join(dir, "npm.png");
    const image: ExtraImage = {
      props: { template: "banner", title: "@kensio/colophon" },
      output: card,
    };

    const error = await assertThrowsErrorAsync(async () =>
      generate(
        options(dir, { config: { sizes: [tinyOg], extra: [image, image] } }),
      ),
    );

    // Both would stamp the one file, so every later build would render both.
    assertStringIncludes(error.message, "Two images would be written to");
    // The whole build stops, rather than leaving half of it on disk.
    assertPathNotExists([card, target]);
  });

  it("rejects an extra image landing on a post's own image", async () => {
    const error = await assertThrowsErrorAsync(async () =>
      generate(withExtra(target)),
    );

    assertStringIncludes(error.message, "Two images would be written to");
    assertPathNotExists(target);
  });

  // Where case does not distinguish two files, it must not distinguish two
  // jobs: both of these write one image, which then re-renders on every build.
  it.runIf(process.platform === "darwin" || process.platform === "win32")(
    "rejects outputs differing only in case where the filesystem ignores it",
    async () => {
      const error = await assertThrowsErrorAsync(async () =>
        generate(
          options(dir, {
            config: {
              sizes: [tinyOg],
              extra: [
                {
                  props: { template: "banner" },
                  output: path.join(dir, "Card.png"),
                },
                {
                  props: { template: "card" },
                  output: path.join(dir, "card.png"),
                },
              ],
            },
          }),
        ),
      );

      assertStringIncludes(error.message, "Two images would be written to");
    },
  );

  it("names an extra image by its output path in warnings", async () => {
    const warnings: string[] = [];
    const card = path.join(dir, "snippet.png");

    await generate(
      options(dir, {
        config: {
          sizes: [tinyOg],
          onWarning: (message) => {
            warnings.push(message);
          },
          extra: [
            {
              props: {
                template: "code",
                language: "text",
                code: "x".repeat(200),
              },
              output: card,
            },
          ],
        },
      }),
    );

    assertArrayLength(warnings, 1);
    assertStringIncludes(warnings[0], `${card}: code snippet does not fit`);
  }, 5000);

  it("gathers images into a public directory and reports their URLs", async () => {
    const out = path.join(dir, "public", "og");

    const results = await generate(
      options(dir, {
        config: {
          sizes: [tinyOg],
          placement: { strategy: "public-dir", dir: out, urlBase: "/og" },
        },
      }),
    );

    assertArrayLength(results, 1);
    assertIdentical(results[0].outputPath, path.join(out, "guide-og.png"));
    assertIdentical(results[0].url, "/og/guide-og.png");
    assertFileExists(path.join(out, "guide-og.png"));
  }, 5000);

  it("reports no URL when nothing says how the images are served", async () => {
    const results = await generate(
      options(dir, { config: { sizes: [tinyOg] } }),
    );

    assertArrayLength(results, 1);
    // The default placement is unchanged: beside the post, and silent on URLs.
    assertIdentical(results[0].outputPath, target);
    assertUndefined(results[0].url);
  }, 5000);

  it("builds URLs beside the content when given a base", async () => {
    const results = await generate(
      options(dir, {
        config: {
          sizes: [tinyOg],
          placement: {
            strategy: "beside-content",
            urlBase: "https://example.com",
          },
        },
      }),
    );

    assertArrayLength(results, 1);
    assertIdentical(results[0].url, "https://example.com/guide/guide-og.png");
  }, 5000);

  it("rejects two posts placed on the same path", async () => {
    // Flat placement, and both posts slugged after their own filename.
    await mkdir(path.join(dir, "docs"), { recursive: true });
    await writeFile(
      path.join(dir, "docs", "guide.md"),
      "---\nmeta_img_props:\n  template: card\n  title: Other guide\n---\n",
    );

    const error = await assertThrowsErrorAsync(async () =>
      generate(
        options(dir, {
          config: {
            sizes: [tinyOg],
            placement: { strategy: "public-dir", dir: path.join(dir, "og") },
          },
        }),
      ),
    );

    // Naming both is the point: the path alone does not say which two posts.
    assertStringIncludes(error.message, path.join("guide", "index.md"));
    assertStringIncludes(error.message, path.join("docs", "guide.md"));
    assertPathNotExists(path.join(dir, "og", "guide-og.png"));
  }, 5000);

  /** A build that writes a manifest into the scratch directory. */
  function withManifest(overrides: Partial<GenerateOptions> = {}) {
    const manifest = path.join(dir, "data", "colophon.json");

    return {
      manifest,
      options: options(dir, {
        config: {
          sizes: tinySizes,
          manifest,
          placement: { strategy: "beside-content", urlBase: "/" },
        },
        ...overrides,
      }),
    };
  }

  it("writes a manifest of everything it generated", async () => {
    const { manifest, options: withIt } = withManifest();

    await generate(withIt);

    const written = await readManifest(manifest);
    assertIdentical(written.version, 1);
    assertObjectMatches(written.pages["guide"], {
      images: {
        og: { url: "/guide/guide-og.png", width: 32, height: 32 },
        square: { url: "/guide/guide-square.png", width: 16, height: 16 },
      },
      // Both fixtures are square, so this is the tie going to the first size.
      widest: "og",
      alt: "Guide",
    });
  }, 5000);

  it("refuses a manifest written over one of its own images", async () => {
    const card = path.join(dir, "card.json");

    const error = await assertThrowsErrorAsync(async () =>
      generate(
        options(dir, {
          config: {
            sizes: [tinyOg],
            manifest: card,
            extra: [{ props: { template: "banner" }, output: card }],
          },
        }),
      ),
    );

    // Written last, it would replace the image and re-render it every build.
    assertStringIncludes(error.message, "manifest path");
    assertPathNotExists([card, target]);
  }, 5000);

  it("writes the manifest even when every image is skipped", async () => {
    const { manifest, options: withIt } = withManifest();
    await generate(withIt);
    await rm(manifest);

    const results = await generate(withIt);

    // The manifest says what exists, not what this run happened to do.
    assertTrue(results.every((result) => result.skipped));
    assertFileExists(manifest);
  }, 10_000);

  it("refuses a manifest two pages would share, before rendering anything", async () => {
    await mkdir(path.join(dir, "docs"), { recursive: true });
    await writeFile(
      path.join(dir, "docs", "guide.md"),
      "---\nmeta_img_props:\n  template: card\n  title: Other guide\n---\n",
    );
    const { manifest, options: withIt } = withManifest();

    const error = await assertThrowsErrorAsync(async () => generate(withIt));

    assertStringIncludes(error.message, 'Two pages share the slug "guide"');
    assertPathNotExists([manifest, target]);
  }, 5000);

  /** A build whose images are named after their own digest. */
  function hashed(): GenerateOptions {
    return options(dir, {
      config: {
        sizes: [tinyOg],
        manifest: path.join(dir, "data", "colophon.json"),
        placement: {
          strategy: "public-dir",
          dir: path.join(dir, "og"),
          urlBase: "/og",
          hash: true,
        },
      },
    });
  }

  it("names an image after its own digest when asked", async () => {
    const results = await generate(hashed());

    assertArrayLength(results, 1);
    const name = path.basename(results[0].outputPath);
    const [stem, hash, extension] = name.split(".");
    assertIdentical(stem, "guide-og");
    assertStringLength(hash ?? "", 8);
    assertIdentical(extension, "png");

    // The URL is built from the same name, so the two cannot disagree.
    assertIdentical(results[0].url, `/og/${name}`);
    assertFileExists(results[0].outputPath);
  }, 5000);

  it("gives a corrected post a URL nobody has cached", async () => {
    const [before] = await generate(hashed());
    await writeFile(
      path.join(dir, "guide", "index.md"),
      "---\nmeta_img_props:\n  template: banner\n  title: Corrected\n---\n",
    );

    const [after] = await generate(hashed());

    assertNonNullable(before);
    assertNonNullable(after);
    assertFalse(after.skipped);
    // A new name, so a platform caching the old URL is not the problem it was.
    assertSetSize(new Set([before.url, after.url]), 2);
    // And the old file is still there, for whoever already has its URL.
    assertFileExists(before.outputPath);
    assertFileExists(after.outputPath);

    // The manifest is how a site finds the current one.
    const manifest = await readManifest(
      path.join(dir, "data", "colophon.json"),
    );
    assertIdentical(manifest.pages["guide"]?.images["og"]?.url, after.url);
  }, 10_000);

  it("still skips a hashed image that has not changed", async () => {
    await generate(hashed());

    const results = await generate(hashed());

    assertTrue(results.every((result) => result.skipped));
  }, 10_000);

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

  it("has no URL for an image a callback placed", async () => {
    const results = await generate(
      options(dir, {
        config: {
          sizes: [tinyOg],
          placement: { strategy: "public-dir", dir: "public", urlBase: "/og" },
        },
        outputPath: (file) => path.join(dir, `${file.slug}.png`),
      }),
    );

    assertArrayLength(results, 1);
    // The callback won, so the placement's URL would name the wrong file.
    assertIdentical(results[0].outputPath, path.join(dir, "guide.png"));
    assertUndefined(results[0].url);
  }, 5000);
});
