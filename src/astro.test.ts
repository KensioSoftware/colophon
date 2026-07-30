import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  assertFileExists,
  assertIdentical,
  assertObjectHasProperty,
  assertStringIncludes,
  assertThrowsErrorAsync,
} from "@kensio/smartass";
import { afterEach, beforeEach, describe, it } from "vitest";

import colophon from "./astro/index.js";
import type { Manifest, OutputSize } from "./types.js";

const tiny: OutputSize = { name: "og", width: 32, height: 16 };

describe("the Astro integration", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "colophon-astro-"));
    await mkdir(path.join(dir, "src", "content"), { recursive: true });
    await writeFile(
      path.join(dir, "src", "content", "post.md"),
      "---\nmeta_img_props:\n  template: card\n  title: A post\n---\n",
    );
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("is the shape Astro expects an integration to be", () => {
    const integration = colophon({ contentDir: "src/content" });

    assertIdentical(integration.name, "@kensio/colophon");
    assertObjectHasProperty(integration.hooks, "astro:config:setup");
  });

  it("renders the images and writes the manifest when the hook runs", async () => {
    // `astro:config:setup` rather than a build hook, because it is the one that
    // fires for `astro dev` too, and because a page that reads the manifest is
    // built after it.
    const manifestPath = path.join(dir, "src", "data", "colophon.json");
    const integration = colophon({
      contentDir: path.join(dir, "src", "content"),
      config: { sizes: [tiny], manifest: manifestPath },
    });

    await integration.hooks["astro:config:setup"]();

    assertFileExists(path.join(dir, "src", "content", "post-og.png"));
    const manifest = JSON.parse(
      await readFile(manifestPath, "utf8"),
    ) as Manifest;
    assertObjectHasProperty(manifest.pages, "post");
  }, 10_000);

  it("fails the build when the images cannot be rendered", async () => {
    // An integration that swallowed this would leave a site shipping pages
    // whose tags point at images that were never written.
    const integration = colophon({
      contentDir: path.join(dir, "src", "content"),
      config: { sizes: [tiny], fonts: [{ path: "nowhere.ttf" }] },
    });

    const error = await assertThrowsErrorAsync(async () =>
      integration.hooks["astro:config:setup"](),
    );

    assertStringIncludes(error.message, "font file not found");
  }, 10_000);
});
