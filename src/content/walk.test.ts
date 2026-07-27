import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  assertArrayEquals,
  assertArrayLength,
  assertIdentical,
  assertNonNullable,
  assertObjectEquals,
  assertStringIncludes,
  assertThrowsErrorAsync,
} from "@kensio/smartass";
import { afterEach, beforeEach, describe, it } from "vitest";

import { walkContent } from "./walk.js";

describe("walkContent", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "colophon-walk-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  async function write(relative: string, contents: string): Promise<void> {
    const full = path.join(dir, relative);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, contents);
  }

  it("collects markdown files that declare props and skips the rest", async () => {
    await write(
      "a/index.md",
      "---\nmeta_img_props:\n  template: banner\n  title: A\n---\nbody",
    );
    await write(
      "nested/deep/post.markdown",
      "---\nmeta_img_props:\n  template: card\n  title: Deep\n---\n",
    );
    await write("b/no-props.md", "---\ntitle: nope\n---\nbody");
    await write("c/notes.txt", "ignored");

    const files = await walkContent({ dir });
    const paths = files
      .map((file) => file.contentPath)
      .toSorted((a, b) => a.localeCompare(b));

    assertArrayEquals(paths, [
      path.join("a", "index.md"),
      path.join("nested", "deep", "post.markdown"),
    ]);

    const a = files.find((file) => file.contentPath.startsWith("a"));
    assertNonNullable(a);
    assertObjectEquals(a.props, { template: "banner", title: "A" });
    assertIdentical(a.absolutePath, path.join(dir, "a", "index.md"));
    // No frontmatter slug → derived from the path (index.md → directory name).
    assertIdentical(a.slug, "a");
  });

  it("prefers a frontmatter slug, trimmed", async () => {
    await write(
      "post/index.md",
      "---\nslug: '  keyword-rich-slug  '\nmeta_img_props:\n  template: banner\n  title: A\n---\n",
    );

    const files = await walkContent({ dir });

    assertArrayLength(files, 1);
    assertIdentical(files[0].slug, "keyword-rich-slug");
  });

  it("reads the slug from a custom frontmatter field", async () => {
    await write(
      "post/index.md",
      "---\npermalink: custom-permalink\nmeta_img_props:\n  template: banner\n  title: A\n---\n",
    );

    const files = await walkContent({ dir, slugField: "permalink" });

    assertArrayLength(files, 1);
    assertIdentical(files[0].slug, "custom-permalink");
  });

  it("passes walk options through to prop extraction", async () => {
    await write("post.md", "---\nog:\n  title: Custom\n---\n");

    const files = await walkContent({
      dir,
      propsKey: "og",
      defaultTemplate: "card",
    });

    assertArrayLength(files, 1);
    assertObjectEquals(files[0].props, {
      template: "card",
      title: "Custom",
    });
    assertIdentical(files[0].slug, "post");
  });

  it("slugs a docs tree by route when asked", async () => {
    await write(
      "index.md",
      "---\nmeta_img_props:\n  template: card\n  title: Home\n---\n",
    );
    await write(
      "services/iam/index.md",
      "---\nmeta_img_props:\n  template: card\n  title: IAM\n---\n",
    );
    await write(
      "guides/getting-started.md",
      "---\nmeta_img_props:\n  template: card\n  title: Start\n---\n",
    );

    const files = await walkContent({ dir, slugStrategy: "route" });

    assertArrayEquals(
      files.map((file) => file.slug).toSorted((a, b) => a.localeCompare(b)),
      ["guides/getting-started", "index", "services/iam"],
    );
  });

  it("lets a declared slug win over the route strategy", async () => {
    await write(
      "services/iam/index.md",
      "---\nslug: identity\nmeta_img_props:\n  template: card\n  title: IAM\n---\n",
    );

    const files = await walkContent({ dir, slugStrategy: "route" });

    assertArrayLength(files, 1);
    assertIdentical(files[0].slug, "identity");
  });

  it("refuses a declared slug that would escape the content tree", async () => {
    await write(
      "posts/evil.md",
      "---\nslug: ../../../tmp/pwned\nmeta_img_props:\n  template: card\n  title: E\n---\n",
    );

    const error = await assertThrowsErrorAsync(async () =>
      walkContent({ dir }),
    );

    // Left alone, `generate` would create those directories and write there.
    assertStringIncludes(error.message, 'Invalid slug "../../../tmp/pwned"');
    assertStringIncludes(error.message, path.join("posts", "evil.md"));
  });

  it("refuses an absolute declared slug", async () => {
    await write(
      "posts/abs.md",
      "---\nslug: /etc/pwned\nmeta_img_props:\n  template: card\n  title: A\n---\n",
    );

    const error = await assertThrowsErrorAsync(async () =>
      walkContent({ dir }),
    );

    assertStringIncludes(error.message, 'Invalid slug "/etc/pwned"');
  });

  it("still allows the nested slug a route strategy produces", async () => {
    await write(
      "services/iam/index.md",
      "---\nmeta_img_props:\n  template: card\n  title: IAM\n---\n",
    );

    const files = await walkContent({ dir, slugStrategy: "route" });

    assertArrayLength(files, 1);
    assertIdentical(files[0].slug, "services/iam");
  });

  it("covers a tree of existing posts through a frontmatter mapper", async () => {
    await write("one.md", "---\ntitle: One\ndescription: First\n---\nbody");
    await write("two.md", "---\ntitle: Two\n---\nbody");
    await write("draft.md", "---\ntitle: Draft\ndraft: true\n---\nbody");

    const files = await walkContent({
      dir,
      defaultTemplate: "banner",
      props: (frontmatter) =>
        frontmatter["draft"] === true
          ? undefined
          : {
              title: frontmatter["title"],
              subtitle: frontmatter["description"],
            },
    });

    // Not one of these posts carries a props block, and the draft stays out.
    assertArrayLength(files, 2);
    assertArrayEquals(
      files.map((file) => file.slug).toSorted((a, b) => a.localeCompare(b)),
      ["one", "two"],
    );
  });
});
