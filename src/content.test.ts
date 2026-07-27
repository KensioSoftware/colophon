import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  assertArrayEquals,
  assertArrayLength,
  assertIdentical,
  assertNonNullable,
  assertObjectEquals,
  assertUndefined,
} from "@kensio/smartass";
import { afterEach, beforeEach, describe, it } from "vitest";

import { extractProps, slugFromPath, walkContent } from "./content/index.js";

describe("extractProps", () => {
  it("returns undefined when the props key is absent", () => {
    assertUndefined(extractProps({ title: "t" }));
  });

  it("returns undefined when the props value is not an object", () => {
    assertUndefined(extractProps({ meta_img_props: "nope" }));
    assertUndefined(extractProps({ meta_img_props: ["a"] }));
  });

  it("returns undefined when there is no template and no default", () => {
    assertUndefined(extractProps({ meta_img_props: { title: "t" } }));
  });

  it("uses the default template when the field is missing", () => {
    const props = extractProps(
      { meta_img_props: { title: "t" } },
      { defaultTemplate: "banner" },
    );

    assertNonNullable(props);
    assertIdentical(props.template, "banner");
  });

  it("omits the title when absent, and coerces a scalar one", () => {
    const untitled = extractProps({ meta_img_props: { template: "code" } });
    assertNonNullable(untitled);
    assertUndefined(untitled.title);

    const numeric = extractProps({
      meta_img_props: { template: "banner", title: 5 },
    });
    assertNonNullable(numeric);
    assertIdentical(numeric.title, "5");
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

    assertObjectEquals(props, {
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

    assertObjectEquals(props, { template: "card", title: "T", extra: 1 });
  });
});

describe("extractProps with a frontmatter mapper", () => {
  /** A site whose posts carry `title`/`description`, as most already do. */
  const fromFrontmatter = {
    defaultTemplate: "banner",
    props: (frontmatter: Record<string, unknown>) => ({
      title: frontmatter["title"],
      subtitle: frontmatter["description"],
    }),
  };

  it("builds props from a post that declares none", () => {
    const props = extractProps(
      { title: "Existing post", description: "Written years ago" },
      fromFrontmatter,
    );

    assertNonNullable(props);
    assertIdentical(props.template, "banner");
    assertIdentical(props.title, "Existing post");
    assertIdentical(props.subtitle, "Written years ago");
  });

  it("lets a post override one mapped field and keep the rest", () => {
    const props = extractProps(
      {
        title: "Existing post",
        description: "Written years ago",
        meta_img_props: { subtitle: "A better subtitle" },
      },
      fromFrontmatter,
    );

    assertNonNullable(props);
    assertIdentical(props.subtitle, "A better subtitle");
    // Restating the whole block to correct one field would defeat the point.
    assertIdentical(props.title, "Existing post");
  });

  it("lets a post override the template the mapper chose", () => {
    const props = extractProps(
      { title: "Snippet", meta_img_props: { template: "code" } },
      fromFrontmatter,
    );

    assertNonNullable(props);
    assertIdentical(props.template, "code");
  });

  it("skips a post the mapper opts out of", () => {
    assertUndefined(
      extractProps(
        { title: "Draft", draft: true },
        {
          defaultTemplate: "banner",
          props: (frontmatter) =>
            frontmatter["draft"] === true
              ? undefined
              : { title: frontmatter["title"] },
        },
      ),
    );
  });

  it("still renders a post that asks outright, even when the mapper skips it", () => {
    const props = extractProps(
      { title: "Draft", draft: true, meta_img_props: { template: "card" } },
      {
        defaultTemplate: "banner",
        props: (frontmatter) =>
          frontmatter["draft"] === true ? undefined : { title: "x" },
      },
    );

    assertNonNullable(props);
    assertIdentical(props.template, "card");
  });

  it("skips a mapped post with no template to render with", () => {
    assertUndefined(
      extractProps(
        { title: "Existing post" },
        { props: (frontmatter) => ({ title: frontmatter["title"] }) },
      ),
    );
  });
});

describe("slugFromPath", () => {
  it("uses the parent directory for index files", () => {
    assertIdentical(
      slugFromPath(path.join("blog", "my-post", "index.md")),
      "my-post",
    );
  });

  it("uses the filename for non-index files", () => {
    assertIdentical(slugFromPath(path.join("blog", "my-post.md")), "my-post");
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
