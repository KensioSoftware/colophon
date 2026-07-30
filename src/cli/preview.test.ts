import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  assertFileExists,
  assertIdentical,
  assertPathNotExists,
  assertStringIncludes,
  assertThrowsErrorAsync,
} from "@kensio/smartass";
import { afterEach, beforeEach, describe, it } from "vitest";

import type { ColophonConfig, OutputSize } from "../types.js";
import { previewImage } from "./preview/index.js";
import { contentRootFor } from "./preview/root.js";

const tinyOg: OutputSize = { name: "og", width: 32, height: 32 };
const tinySquare: OutputSize = { name: "square", width: 16, height: 16 };
const config: ColophonConfig = { sizes: [tinyOg, tinySquare] };

describe("contentRootFor", () => {
  it("reads a post under the working directory against that directory", () => {
    // Which is what keeps a page bundle named after its own directory: rooted
    // at the post instead, every `hello/index.md` in a site previews as `index`
    // and the second one lands on the first.
    assertIdentical(
      contentRootFor(path.join("content", "hello", "index.md")),
      process.cwd(),
    );
  });

  it("falls back to its own directory for a post from elsewhere", () => {
    const outside = path.join(tmpdir(), "elsewhere", "post.md");

    assertIdentical(contentRootFor(outside), path.dirname(outside));
  });
});

describe("previewImage", () => {
  let dir: string;
  let post: string;
  const rendered: string[] = [];

  /** Preview the fixture post, remembering the file so it can be cleaned up. */
  async function preview(size: string | undefined): Promise<string> {
    const output = await previewImage({ file: post, config, size });
    rendered.push(output);
    return output;
  }

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "colophon-preview-"));
    post = path.join(dir, "post.md");
    await writeFile(
      post,
      "---\nmeta_img_props:\n  template: banner\n  title: Post\n---\n",
    );
  });

  afterEach(async () => {
    await Promise.all([
      rm(dir, { recursive: true, force: true }),
      ...rendered.map(async (file) => rm(file, { force: true })),
    ]);
    rendered.length = 0;
  });

  it("renders the first configured size outside the content tree", async () => {
    const output = await preview(undefined);

    assertFileExists(output);
    assertIdentical(path.basename(output), "post-og.png");
    // Beside the post it would land on the real image, which the next build
    // would then find unstamped and render over.
    assertPathNotExists(path.join(dir, "post-og.png"));
  }, 5000);

  it("renders the size that was asked for", async () => {
    const output = await preview("square");

    assertIdentical(path.basename(output), "post-square.png");
  }, 5000);

  it("rejects a size the config does not declare", async () => {
    const error = await assertThrowsErrorAsync(async () => preview("tall"));

    assertStringIncludes(error.message, 'Unknown size "tall"');
    assertStringIncludes(error.message, "og, square");
  });

  it("says so when the post asks for no image at all", async () => {
    const plain = path.join(dir, "plain.md");
    await writeFile(plain, "---\ntitle: No props here\n---\n");

    const error = await assertThrowsErrorAsync(async () =>
      previewImage({ file: plain, config, size: undefined }),
    );

    assertStringIncludes(error.message, "declares no image props");
  });

  it("reads the props a config's mapper builds", async () => {
    const plain = path.join(dir, "mapped.md");
    await writeFile(plain, "---\ntitle: Mapped\n---\n");

    const output = await previewImage({
      file: plain,
      config: {
        ...config,
        content: {
          defaultTemplate: "card",
          props: (frontmatter) => ({ title: frontmatter["title"] }),
        },
      },
      size: undefined,
    });
    rendered.push(output);

    assertFileExists(output);
  }, 5000);
});
