import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { extractProps, slugFromPath, walkContent } from "./content/index.js";

describe("extractProps", () => {
  it("returns undefined when the props key is absent", () => {
    expect(extractProps({ title: "t" })).toBeUndefined();
  });

  it("returns undefined when the props value is not an object", () => {
    expect(extractProps({ meta_img_props: "nope" })).toBeUndefined();
    expect(extractProps({ meta_img_props: ["a"] })).toBeUndefined();
  });

  it("returns undefined when there is no template and no default", () => {
    expect(extractProps({ meta_img_props: { title: "t" } })).toBeUndefined();
  });

  it("uses the default template when the field is missing", () => {
    const props = extractProps(
      { meta_img_props: { title: "t" } },
      { defaultTemplate: "banner" },
    );

    expect(props?.template).toBe("banner");
  });

  it("returns undefined when the title is missing or not a string", () => {
    expect(
      extractProps({ meta_img_props: { template: "banner" } }),
    ).toBeUndefined();
    expect(
      extractProps({ meta_img_props: { template: "banner", title: 5 } }),
    ).toBeUndefined();
  });

  it("reads template, title, subtitle, version and extras", () => {
    const props = extractProps({
      meta_img_props: {
        template: "banner",
        title: "Hello",
        subtitle: "Sub",
        version: 3,
        accent: "#f00",
      },
    });

    expect(props).toStrictEqual({
      template: "banner",
      title: "Hello",
      subtitle: "Sub",
      version: "3",
      accent: "#f00",
    });
  });

  it("honours a custom props key and template field", () => {
    const props = extractProps(
      { og: { format: "card", title: "T", extra: 1 } },
      { propsKey: "og", templateField: "format" },
    );

    expect(props).toStrictEqual({ template: "card", title: "T", extra: 1 });
  });
});

describe("slugFromPath", () => {
  it("uses the parent directory for index files", () => {
    expect(slugFromPath(path.join("blog", "my-post", "index.md"))).toBe(
      "my-post",
    );
  });

  it("uses the filename for non-index files", () => {
    expect(slugFromPath(path.join("blog", "my-post.md"))).toBe("my-post");
  });
});

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

    expect(paths).toStrictEqual([
      path.join("a", "index.md"),
      path.join("nested", "deep", "post.markdown"),
    ]);

    const a = files.find((file) => file.contentPath.startsWith("a"));
    expect(a?.props).toStrictEqual({ template: "banner", title: "A" });
    expect(a?.absolutePath).toBe(path.join(dir, "a", "index.md"));
    // No frontmatter slug → derived from the path (index.md → directory name).
    expect(a?.slug).toBe("a");
  });

  it("prefers a frontmatter slug, trimmed", async () => {
    await write(
      "post/index.md",
      "---\nslug: '  keyword-rich-slug  '\nmeta_img_props:\n  template: banner\n  title: A\n---\n",
    );

    const [file] = await walkContent({ dir });
    expect(file?.slug).toBe("keyword-rich-slug");
  });

  it("reads the slug from a custom frontmatter field", async () => {
    await write(
      "post/index.md",
      "---\npermalink: custom-permalink\nmeta_img_props:\n  template: banner\n  title: A\n---\n",
    );

    const [file] = await walkContent({ dir, slugField: "permalink" });
    expect(file?.slug).toBe("custom-permalink");
  });

  it("passes walk options through to prop extraction", async () => {
    await write("post.md", "---\nog:\n  title: Custom\n---\n");

    const files = await walkContent({
      dir,
      propsKey: "og",
      defaultTemplate: "card",
    });

    expect(files).toHaveLength(1);
    expect(files[0]!.props).toStrictEqual({
      template: "card",
      title: "Custom",
    });
    expect(files[0]!.slug).toBe("post");
  });
});
