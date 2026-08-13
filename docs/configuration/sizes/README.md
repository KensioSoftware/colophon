# Output sizes and filenames

Each output size is a named `{ name, width, height }`. The `name` becomes the
filename suffix, so every image a post produces is distinct:
`my-post-og.png`, `my-post-square.png`.

The default set is one 1.91:1 Open Graph landscape and one 1:1 square. Between
them they satisfy `og:image` and both `twitter:image` card types, since
`summary_large_image` reuses the landscape and `summary` uses the square.

## Choosing sizes

`SIZE_PRESETS` ships the common standards, and you can compose your own set from
those and anything custom:

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

A size can also carry its own config overrides, applied only when rendering it.
See [Per-size config](../per-size-config/). `thumbnail` is the one preset that
does: it sets `textureScale: 3`, because a thumbnail is looked at in a fraction
of the space it is uploaded at and a texture at its stated lengths would arrive
too fine to see. Pair it with the
[`thumbnail` template](../../templates/#thumbnail).

## The base filename

The base filename is the post slug. Colophon reads a top-level `slug` from
frontmatter, falling back to the file name, or to the parent directory for
`index.*` files.

Point `content.slugField` at a different key to read the slug from somewhere
else, or override naming entirely with `generate`'s `outputPath` callback.

## Slug strategies

There are two ways to derive a slug from a path, for sites that address content
differently. `basename` is the default:

| Path                    | `basename` | `route`        |
| ----------------------- | ---------- | -------------- |
| `index.md`              | `index`    | `index`        |
| `blog/my-post.md`       | `my-post`  | `blog/my-post` |
| `services/iam/index.md` | `iam`      | `services/iam` |

`basename` suits Hugo-style page bundles, where the image belongs beside its
post.

`route` suits a site addressed by route. In a docs tree where
`services/iam/index.md` is served at `/services/iam`, an image named to match is
easier to look up:

```ts
export default defineConfig({
  content: { slugStrategy: "route" },
});
```

A slug carrying directories is written from the content root rather than beside
the file, so `services/iam` becomes `content/services/iam-og.png`. Resolving it
beside the file would repeat the directories already named in the slug.

A frontmatter `slug` still wins over either strategy.

`route` also matters for [placement](../placement/): gathering a whole tree into
one directory makes filename collisions easy to hit, and route slugs keep each
post's section in its name.
