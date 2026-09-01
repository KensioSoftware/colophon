import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

import {
  assertArrayEquals,
  assertIdentical,
  assertObjectEquals,
  assertObjectMatches,
  assertStringIncludes,
  assertTypeString,
} from "@kensio/smartass";
import matter from "gray-matter";
import { describe, it } from "vitest";

import type { CliArgs } from "./args/index.js";
import { configForPlayground } from "./playground/config.js";
import { playgroundLink } from "./playground/index.js";
import { fallbackFrontmatter } from "./playground/sample.js";
import type { PlaygroundState } from "./playground/share.js";
import { shareUrl } from "./playground/share.js";

function args(overrides: Partial<CliArgs> = {}): CliArgs {
  return {
    command: "playground",
    contentDir: undefined,
    file: undefined,
    adapter: undefined,
    configPath: undefined,
    overwrite: false,
    dryRun: false,
    watch: false,
    concurrency: undefined,
    size: undefined,
    ...overrides,
  };
}

function stateOf(url: string): PlaygroundState {
  const encoded = new URL(url).searchParams.get("s");
  assertTypeString(encoded);
  return JSON.parse(
    inflateRawSync(Buffer.from(encoded, "base64url")).toString("utf8"),
  ) as PlaygroundState;
}

describe("playground links", () => {
  it("uses the share format read by colophonjs.dev", () => {
    // Given a config and frontmatter ready for the playground.
    const state = {
      config: '{ "theme": "paper" }',
      frontmatter: "---\ntitle: Example\n---\n",
      size: "square",
    };

    // When they are put in a playground URL.
    const url = shareUrl(state);

    // Then inflating its state returns the same fields.
    assertStringIncludes(url, "https://colophonjs.dev/playground/?s=");
    assertObjectEquals(stateOf(url), state);
  });

  it("discovers the config and makes mapper-produced props explicit", async () => {
    // Given a project whose first image post depends on a props mapper.
    const dir = await mkdtemp(path.join(tmpdir(), "colophon-playground-"));
    await mkdir(path.join(dir, "src", "content"), { recursive: true });
    await writeFile(
      path.join(dir, "colophon.config.mjs"),
      `export default {
        theme: "midnight",
        content: {
          propsKey: "social",
          templateField: "kind",
          defaultTemplate: "card",
          extensions: [".md"],
          props: frontmatter => ({ subtitle: frontmatter.description })
        }
      };`,
    );
    await writeFile(
      path.join(dir, "src", "content", "post.md"),
      "---\ntitle: Found post\ndescription: From the mapper\n---\nBody\n",
    );

    // When the project asks for a link without naming either file.
    const link = await playgroundLink(args({ size: "square" }), dir);
    const state = stateOf(link.url);
    const config = JSON.parse(state.config) as Record<string, unknown>;
    const frontmatter = matter(state.frontmatter).data as Record<
      string,
      unknown
    >;

    // Then the discovered post renders without running JavaScript in the browser.
    assertIdentical(config["theme"], "midnight");
    assertObjectEquals(frontmatter["social"], {
      kind: "card",
      title: "Found post",
      subtitle: "From the mapper",
    });
    assertObjectMatches(state, { size: "square" });
    assertArrayEquals(link.omitted, ["content.props"]);
  });

  it("leaves filesystem and executable config out of the link", () => {
    // Given config fields the browser cannot load or run.
    const shared = configForPlayground({
      theme: "forest",
      fonts: [{ path: "brand.ttf" }],
      logo: { path: "logo.svg" },
      background: { type: "image", source: { path: "photo.jpg" } },
      onWarning: () => undefined,
      templates: {},
    });

    // When it is converted to playground JSON.
    const parsed = JSON.parse(shared.text) as Record<string, unknown>;

    // Then the usable theme remains and unsupported fields are named.
    assertObjectEquals(parsed, { theme: "forest" });
    assertArrayEquals(shared.omitted, [
      "fonts",
      "logo",
      "onWarning",
      "templates",
      "background",
    ]);
  });

  it("leaves post image paths out of the shared frontmatter", async () => {
    // Given a post that refers to files on the build machine.
    const dir = await mkdtemp(path.join(tmpdir(), "colophon-playground-"));
    const post = path.join(dir, "post.md");
    await writeFile(
      post,
      "---\nmeta_img_props:\n  template: photo\n  image: photo.jpg\n  avatar: author.png\n---\n",
    );

    // When that post is put in a playground link.
    const link = await playgroundLink(args({ file: post }), dir);
    const frontmatter = matter(stateOf(link.url).frontmatter).data as Record<
      string,
      unknown
    >;

    // Then its effective props remain without paths the browser cannot read.
    assertObjectEquals(frontmatter["meta_img_props"], { template: "photo" });
    assertArrayEquals(link.omitted, [
      "frontmatter.avatar",
      "frontmatter.image",
    ]);
  });

  it("supplies a renderable post when the project has no content tree", () => {
    // Given config with custom frontmatter names.
    const config = {
      content: { propsKey: "image", templateField: "layout" },
    };

    // When no project post can be included.
    const frontmatter = matter(fallbackFrontmatter(config)).data;

    // Then the fallback uses those names.
    assertObjectEquals(frontmatter, {
      title: "Sample post",
      image: { layout: "banner" },
    });
  });
});
