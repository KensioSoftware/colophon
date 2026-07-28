import path from "node:path";

import {
  assertIdentical,
  assertStringIncludes,
  assertThrowsError,
  assertUndefined,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { createPlacer } from "./placement/index.js";
import type { ContentFile, OutputSize, Placement } from "./types.js";

const og: OutputSize = { name: "og", width: 1200, height: 630 };

/** A page bundle: `content/guide/index.md`, slugged after its directory. */
const bundled: ContentFile = {
  contentPath: path.join("guide", "index.md"),
  absolutePath: path.join("content", "guide", "index.md"),
  slug: "guide",
  props: { template: "banner", title: "Guide" },
};

/** The same post under the `route` slug strategy. */
const routed: ContentFile = {
  ...bundled,
  contentPath: path.join("services", "iam", "index.md"),
  slug: "services/iam",
};

describe("createPlacer", () => {
  it("places an image beside its post by default", () => {
    const placed = createPlacer(undefined, "content")(bundled, og);

    assertIdentical(placed.path, path.join("content", "guide", "guide-og.png"));
    // Nothing said how the tree is served, so nothing is claimed about it.
    assertUndefined(placed.url);
  });

  it("builds a URL from the path under the content root", () => {
    const placed = createPlacer(
      { strategy: "beside-content", urlBase: "/" },
      "content",
    )(bundled, og);

    assertIdentical(placed.url, "/guide/guide-og.png");
  });

  it("places a route slug from the content root", () => {
    const placed = createPlacer(
      { strategy: "beside-content", urlBase: "/" },
      "content",
    )(routed, og);

    // Beside the file would repeat the directories already in the slug.
    assertIdentical(
      placed.path,
      path.join("content", "services", "iam-og.png"),
    );
    assertIdentical(placed.url, "/services/iam-og.png");
  });

  it("gathers images into a public directory", () => {
    const placed = createPlacer(
      {
        strategy: "public-dir",
        dir: path.join("public", "og"),
        urlBase: "/og",
      },
      "content",
    )(bundled, og);

    assertIdentical(placed.path, path.join("public", "og", "guide-og.png"));
    assertIdentical(placed.url, "/og/guide-og.png");
  });

  it("keeps a route slug's directories under the public directory", () => {
    const placed = createPlacer(
      { strategy: "public-dir", dir: "public", urlBase: "/" },
      "content",
    )(routed, og);

    assertIdentical(placed.path, path.join("public", "services", "iam-og.png"));
    assertIdentical(placed.url, "/services/iam-og.png");
  });

  it("has no URL for a public directory nobody said how to reach", () => {
    const placed = createPlacer(
      { strategy: "public-dir", dir: "public/og" },
      "content",
    )(bundled, og);

    assertIdentical(placed.path, path.join("public", "og", "guide-og.png"));
    assertUndefined(placed.url);
  });

  it("does not double a separator the URL base already ends with", () => {
    const placed = createPlacer(
      {
        strategy: "public-dir",
        dir: "public/og",
        urlBase: "https://cdn.example.com/og/",
      },
      "content",
    )(bundled, og);

    assertIdentical(placed.url, "https://cdn.example.com/og/guide-og.png");
  });

  it("hands both halves to a custom placement", () => {
    const placed = createPlacer(
      {
        strategy: "custom",
        path: (file, size) => `dated/2026/${file.slug}.${size.name}.png`,
        url: (file, size) => `/img/2026/${file.slug}.${size.name}.png`,
      },
      "content",
    )(bundled, og);

    assertIdentical(placed.path, "dated/2026/guide.og.png");
    assertIdentical(placed.url, "/img/2026/guide.og.png");
  });

  // A config module is plain JavaScript, so all of these reach the placer;
  // without the check each fails as a complaint about `path` or a function.
  it("rejects a public directory with nowhere to write", () => {
    const error = assertThrowsError(() =>
      createPlacer(
        { strategy: "public-dir" } as unknown as Placement,
        "content",
      ),
    );

    assertStringIncludes(error.message, 'needs a "dir"');
  });

  it("rejects a custom placement with no path function", () => {
    const error = assertThrowsError(() =>
      createPlacer({ strategy: "custom" } as unknown as Placement, "content"),
    );

    assertStringIncludes(error.message, 'needs a "path" function');
  });

  it("rejects a custom URL that is not a function", () => {
    const error = assertThrowsError(() =>
      createPlacer(
        {
          strategy: "custom",
          path: () => "a.png",
          url: "/og",
        } as unknown as Placement,
        "content",
      ),
    );

    assertStringIncludes(error.message, 'takes a "url" function');
  });

  it("rejects a URL base that is not a string", () => {
    const error = assertThrowsError(() =>
      createPlacer(
        {
          strategy: "public-dir",
          dir: "public",
          urlBase: 42,
        } as unknown as Placement,
        "content",
      ),
    );

    assertStringIncludes(error.message, "urlBase must be a string");
  });

  it("lets a custom placement write an image it does not serve", () => {
    const placed = createPlacer(
      { strategy: "custom", path: () => "build/card.png" },
      "content",
    )(bundled, og);

    assertUndefined(placed.url);
  });
});
