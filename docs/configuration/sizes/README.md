---
description: Set output dimensions and filenames for Colophon social images.
---

# Output sizes and filenames

Each output size has a `name`, `width` and `height`. The name becomes a
filename suffix, such as `my-post-og.png` or `my-post-square.png`.

The defaults are a 1.91:1 landscape image for Open Graph and Twitter's
`summary_large_image` card, and a 1:1 square for Twitter's `summary` card.

## Choosing sizes

Choose entries from `SIZE_PRESETS` or define custom sizes:

```ts
import { defineConfig, SIZE_PRESETS } from "@kensio/colophon";

export default defineConfig({
  sizes: [
    SIZE_PRESETS.og, // 1200x630, og:image (Facebook, LinkedIn, Slack)
    SIZE_PRESETS.square, // 1200x1200, Twitter summary card, universal
    SIZE_PRESETS.twitter, // 1200x600 (2:1), Twitter summary_large_image
    SIZE_PRESETS.pinterest, // 1000x1500 (2:3), Pinterest
    SIZE_PRESETS.thumbnail, // 1280x720 (16:9), YouTube video thumbnail
    { name: "hero", width: 1600, height: 900 }, // or anything custom
  ],
});
```

Profile cover presets are `xCover`, `linkedinCover`, `linkedinPageCover`,
`blueskyCover` and `youtubeCover`. Use them under [`extra`](../extra-images/)
for a single profile image. Each includes a safe area that accounts for
platform cropping and avatars. See [Cover images](../cover-images/).

Sizes can include [config overrides](../per-size-config/). The `thumbnail`
preset sets `textureScale: 2` to make textures more visible at reduced display
sizes. Pair it with the [`thumbnail` template](../../templates/#thumbnail).

## The base filename

The base filename is the post slug. Colophon reads a top-level `slug` from
frontmatter, falling back to the file name, or to the parent directory for
`index.*` files.

Point `content.slugField` at a different key to read the slug from somewhere
else, or override naming entirely with `generate`'s `outputPath` callback.

## Slug strategies

Choose how Colophon derives slugs from file paths with `slugStrategy`. The
default is `basename`:

| Path                    | `basename` | `route`        |
| ----------------------- | ---------- | -------------- |
| `index.md`              | `index`    | `index`        |
| `blog/my-post.md`       | `my-post`  | `blog/my-post` |
| `services/iam/index.md` | `iam`      | `services/iam` |

`basename` suits Hugo-style page bundles, where the image belongs beside its
post.

Use `route` to include parent directories in the slug. For example, a docs
page at `services/iam/index.md` gets the slug `services/iam`:

```ts
export default defineConfig({
  content: { slugStrategy: "route" },
});
```

A slug containing directories is resolved from the content root. The slug
`services/iam` therefore produces `content/services/iam-og.png` with default
placement.

A frontmatter `slug` still wins over either strategy.

Route slugs also help avoid filename collisions when
[placement](../placement/) collects images in one directory. They retain the
post's parent directory names.
