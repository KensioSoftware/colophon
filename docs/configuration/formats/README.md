# Output formats

Colophon writes PNG unless you say otherwise. WebP, JPEG and AVIF are each one
setting:

```ts
export default defineConfig({
  format: "webp", // "png" (the default), "jpeg", "webp" or "avif"
  quality: 80, // the default; 1 to 100, ignored by png
});
```

The rasteriser still draws the picture, and the finished raster is encoded into
the format you asked for. So this works with a custom
[rasteriser](../rasteriser/) as well as with the default one.

## What it saves

The two-post site the numbers below come from, at four sizes each, with the
default quality:

| Format | Whole build | A 1200x630 landscape |
| ------ | ----------- | -------------------- |
| `png`  | 396KB       | 82KB                 |
| `jpeg` | 188KB       | 30KB                 |
| `webp` | 112KB       | 18KB                 |
| `avif` | 92KB        | 16KB                 |

WebP is the usual choice. It is read by current browsers and by the crawlers
these images are for, it comes out at about a quarter of the size of the PNG,
and it is no slower to write, because a lossy encoding is cheaper than the
level-9 zlib pass a PNG gets. AVIF is smaller again but slower to encode, and it
is the least widely read of the four.

The pictures are the same to look at. At `80` the gradients these templates are
mostly made of hold up; below about `50` they start to band.

JPEG has no transparency, so a template that left any gets it flattened onto
black. Every built-in template paints its background edge to edge, so this only
comes up in a custom one.

## The filenames follow

An image is named after the format it holds, so a build writing WebP writes
`my-post-og.webp`. `jpeg` is written `.jpg`, which is what the web settled on.

Changing the format therefore renames every image, and the files already written
are left where they are. Nothing here knows whether something is still serving
them, and deleting a URL somebody has shared is not a decision to make on a
project's behalf. Clear the output directory yourself if you want them gone.

A [`custom` placement](../placement/#custom-placements) names its own files and
is not told the format, so it is the one place the extension is yours to keep in
step.

## Capping the size

Some platforms have a ceiling of their own, such as X, which refuses an upload
over 5MB. `maxBytes` records that ceiling:

```ts
export default defineConfig({
  format: "webp",
  quality: 90,
  maxBytes: 5_000_000,
});
```

An image over the cap is encoded again ten quality points lower, and again, down
to a floor of `30`. Stepping rather than searching for the best quality that
fits is deliberate: each step is a whole encoding, and a search would cost
several more of them for a difference nobody can see.

An image that will not fit even at `30` is written anyway and reported through
[`onWarning`](../warnings/):

```text
colophon: blog/post.md: Image is 31KB, over the 20KB maxBytes cap. Quality was
stepped down to 30, which is as far as it goes before the picture stops being
worth having. A smaller output size would do what quality no longer can.
```

That is a warning rather than an error because the image is still the right
image. A build that renders nothing is a worse answer than one that renders
something too big and says which post it was.

PNG is lossless and has no quality to trade, so under `format: "png"` a cap only
ever reports. [`compressionLevel`](../compression/) is the PNG equivalent, and it
is already at its strongest by default. The setting that will actually bring a
PNG down is [`quantise`](../compression/), which reduces it to a palette, though
it is a decision to take once for a site rather than a step an encoder can take
on its own when an image comes out over the cap.

## Writing the SVG too

```ts
export default defineConfig({
  emitSvg: true,
});
```

Each image gets its source document beside it, under the same name with an
`.svg` extension: `my-post-og.png` and `my-post-og.svg`. Under a
[hashed placement](../placement/#content-hashed-filenames) the hash is kept, so
`my-post-og.ecd0aab2.svg` sits next to its own image.

That is the document to hand to a vector editor, to diff when a template
changes, or to serve to anything that would rather have vectors. It is not in
the [manifest](../manifest/) and it carries no
[rebuild stamp](../../rebuilds/), since the image is what a build tracks and the
document follows it.

## They all change every image's stamp

`format`, `quality`, `maxBytes` and `emitSvg` are each part of every image's
rebuild stamp, so changing one re-renders the tree once. `emitSvg` is in for a
version of the same reason: turning it on has to write the documents for images
that are already on disk, and without it they would appear only as each post
next changed.

## They are not per-size

Like [`fonts`](../fonts/) and the [rasteriser](../rasteriser/), these are shared
build inputs rather than something an individual output size can override. They
are about how an image is encoded rather than what it shows. See
[Per-size config](../per-size-config/).
