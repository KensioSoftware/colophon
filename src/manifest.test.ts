import {
  assertArrayEquals,
  assertIdentical,
  assertNonNullable,
  assertObjectMatches,
  assertStringIncludes,
  assertThrowsError,
  assertUndefined,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { resolveConfig } from "./config/index.js";
import type { RenderJob } from "./generate/job.js";
import { buildManifest } from "./manifest/index.js";
import type { MetaImageProps, OutputSize } from "./types.js";

const og: OutputSize = { name: "og", width: 1200, height: 630 };
const square: OutputSize = { name: "square", width: 1200, height: 1200 };
const config = resolveConfig();

function job(
  slug: string | undefined,
  size: OutputSize,
  overrides: Partial<RenderJob> = {},
): RenderJob {
  const props: MetaImageProps = { template: "card", title: "My post" };

  return {
    contentPath: slug === undefined ? undefined : `posts/${slug}.md`,
    slug,
    props,
    size,
    outputPath: `public/og/${slug ?? "extra"}-${size.name}.png`,
    url: `/og/${slug ?? "extra"}-${size.name}.png`,
    stamp: `stamp-${slug ?? "extra"}-${size.name}`,
    config,
    ...overrides,
  };
}

describe("buildManifest", () => {
  it("writes down every page's images, URLs and dimensions", () => {
    const manifest = buildManifest([
      job("my-post", og),
      job("my-post", square),
    ]);

    assertIdentical(manifest.version, 1);
    assertObjectMatches(manifest.pages["my-post"], {
      images: {
        og: { url: "/og/my-post-og.png", width: 1200, height: 630 },
        square: { url: "/og/my-post-square.png", width: 1200, height: 1200 },
      },
      widest: "og",
      alt: "My post",
    });
  });

  it("names the most landscape image, not merely the widest one", () => {
    // Both are 1200 across, so a comparison on width alone would tie and pick
    // whichever came first — and a summary_large_image card wants the og.
    const manifest = buildManifest([
      job("my-post", square),
      job("my-post", og),
    ]);

    assertIdentical(manifest.pages["my-post"]?.widest, "og");
  });

  it("omits a URL the placement did not know", () => {
    const manifest = buildManifest([job("my-post", og, { url: undefined })]);
    const image = manifest.pages["my-post"]?.images["og"];

    assertNonNullable(image);
    assertIdentical(image.width, 1200);
    assertUndefined(image.url);
  });

  it("omits alt text for a page with no title", () => {
    const manifest = buildManifest([
      job("snippet", og, { props: { template: "code", code: "x" } }),
    ]);

    assertUndefined(manifest.pages["snippet"]?.alt);
  });

  it("leaves out an image that is not a page", () => {
    const manifest = buildManifest([job("my-post", og), job(undefined, og)]);

    assertArrayEquals(Object.keys(manifest.pages), ["my-post"]);
  });

  it("sorts pages and their images, so a committed manifest stays still", () => {
    const manifest = buildManifest([
      job("zeta", square),
      job("zeta", og),
      job("alpha", og),
    ]);

    assertArrayEquals(Object.keys(manifest.pages), ["alpha", "zeta"]);
    assertArrayEquals(Object.keys(manifest.pages["zeta"]?.images ?? {}), [
      "og",
      "square",
    ]);
  });

  it("sorts by code unit, so the file reads the same wherever it is built", () => {
    // A locale-aware sort puts these in either order depending on the machine,
    // which is a diff in a committed file saying nothing happened.
    const manifest = buildManifest([
      job("Über", og),
      job("apple", og),
      job("Zebra", og),
    ]);

    assertArrayEquals(Object.keys(manifest.pages), ["Zebra", "apple", "Über"]);
  });

  it("rejects two pages that would share one entry", () => {
    const error = assertThrowsError(() =>
      buildManifest([
        job("intro", og, { contentPath: "blog/intro.md" }),
        job("intro", og, { contentPath: "docs/intro.md" }),
      ]),
    );

    // Their images are distinct on disk, so nothing else would complain.
    assertStringIncludes(error.message, 'Two pages share the slug "intro"');
    assertStringIncludes(error.message, "blog/intro.md and docs/intro.md");
    assertStringIncludes(error.message, 'slugStrategy: "route"');
  });
});
