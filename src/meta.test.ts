import {
  assertArrayEquals,
  assertArrayLength,
  assertIdentical,
  assertStringIncludes,
  assertThrowsError,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { metaTags, metaTagsHtml } from "./meta/index.js";
import type { Manifest, MetaTag } from "./types.js";

const manifest: Manifest = {
  version: 1,
  pages: {
    "blog/my-post": {
      images: {
        og: { url: "/og/blog/my-post-og.png", width: 1200, height: 630 },
        square: {
          url: "/og/blog/my-post-square.png",
          width: 1200,
          height: 1200,
        },
      },
      widest: "og",
      alt: "My post",
    },
    "blog/square-only": {
      images: {
        square: { url: "/og/square-only.png", width: 1200, height: 1200 },
      },
      widest: "square",
    },
  },
};

const site = { baseUrl: "https://example.com" };

/** The name a tag is written under, whichever attribute carries it. */
function keyOf(tag: MetaTag): string {
  return "property" in tag ? tag.property : tag.name;
}

/** The content of one tag, by that name. */
function contentOf(tags: readonly MetaTag[], key: string): string | undefined {
  return tags.find((tag) => keyOf(tag) === key)?.content;
}

describe("metaTags", () => {
  it("describes the page's widest image, absolutely", () => {
    const tags = metaTags(manifest, "blog/my-post", site);

    assertIdentical(
      contentOf(tags, "og:image"),
      "https://example.com/og/blog/my-post-og.png",
    );
    assertIdentical(contentOf(tags, "og:image:width"), "1200");
    assertIdentical(contentOf(tags, "og:image:height"), "630");
    assertIdentical(
      contentOf(tags, "twitter:image"),
      contentOf(tags, "og:image"),
    );
  });

  it("asks for a large card only when the image is landscape enough", () => {
    assertIdentical(
      contentOf(metaTags(manifest, "blog/my-post", site), "twitter:card"),
      "summary_large_image",
    );
    // A square shown as a large card is cropped; `summary` suits it better.
    assertIdentical(
      contentOf(metaTags(manifest, "blog/square-only", site), "twitter:card"),
      "summary",
    );
  });

  it("emits alt text for both platforms, since neither reads the other's", () => {
    const tags = metaTags(manifest, "blog/my-post", site);

    assertIdentical(contentOf(tags, "og:image:alt"), "My post");
    assertIdentical(contentOf(tags, "twitter:image:alt"), "My post");
  });

  it("says nothing about alt text a page does not have", () => {
    const tags = metaTags(manifest, "blog/square-only", site);

    assertArrayEquals(
      tags.map((tag) => keyOf(tag)),
      [
        "og:image",
        "og:image:width",
        "og:image:height",
        "twitter:card",
        "twitter:image",
      ],
    );
  });

  it("leaves an absolute URL alone, for images served from a CDN", () => {
    const cdn: Manifest = {
      version: 1,
      pages: {
        post: {
          images: {
            og: {
              url: "https://cdn.example.com/og/post.png",
              width: 1200,
              height: 630,
            },
          },
          widest: "og",
        },
      },
    };

    assertIdentical(
      contentOf(metaTags(cdn, "post", site), "og:image"),
      "https://cdn.example.com/og/post.png",
    );
  });

  it("emits site-relative URLs when no base is given", () => {
    assertIdentical(
      contentOf(metaTags(manifest, "blog/my-post"), "og:image"),
      "/og/blog/my-post-og.png",
    );
  });

  it("does not double a separator the base already ends with", () => {
    assertIdentical(
      contentOf(
        metaTags(manifest, "blog/my-post", { baseUrl: "https://example.com/" }),
        "og:image",
      ),
      "https://example.com/og/blog/my-post-og.png",
    );
  });

  it("gives a page it has never heard of no tags at all", () => {
    // Not every page has a share image, and a template asking about one should
    // not have to know which in advance.
    assertArrayLength(metaTags(manifest, "blog/draft", site), 0);
  });

  it("complains about a page whose image has no URL", () => {
    const unserved: Manifest = {
      version: 1,
      pages: {
        post: { images: { og: { width: 1200, height: 630 } }, widest: "og" },
      },
    };

    const error = assertThrowsError(() => metaTags(unserved, "post", site));

    assertStringIncludes(error.message, "Set placement.urlBase");
  });

  it("complains about a manifest naming a widest image it does not have", () => {
    const broken: Manifest = {
      version: 1,
      pages: { post: { images: {}, widest: "og" } },
    };

    const error = assertThrowsError(() => metaTags(broken, "post", site));

    assertStringIncludes(error.message, "no image by that name");
  });
});

describe("metaTagsHtml", () => {
  it("renders the tags with the attribute each platform reads", () => {
    const html = metaTagsHtml(manifest, "blog/my-post", site);

    assertStringIncludes(
      html,
      '<meta property="og:image" content="https://example.com/og/blog/my-post-og.png">',
    );
    // Twitter's tags are named with `name`, not `property`, which is the
    // distinction sites most often get wrong.
    assertStringIncludes(
      html,
      '<meta name="twitter:image" content="https://example.com/og/blog/my-post-og.png">',
    );
  });

  it("escapes alt text, which is a post's title and so anyone's to write", () => {
    const quoted: Manifest = {
      version: 1,
      pages: {
        post: {
          images: { og: { url: "/og/post.png", width: 1200, height: 630 } },
          widest: "og",
          alt: 'Tom & Jerry\'s "big" <day>',
        },
      },
    };

    assertStringIncludes(
      metaTagsHtml(quoted, "post"),
      '<meta property="og:image:alt" content="Tom &amp; Jerry&apos;s &quot;big&quot; &lt;day&gt;">',
    );
  });

  it("gives an unknown page an empty string, not a stray blank tag", () => {
    assertIdentical(metaTagsHtml(manifest, "blog/draft", site), "");
  });
});
