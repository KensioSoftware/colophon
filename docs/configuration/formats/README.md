---
description: Choose an image format and set output quality and file size limits in Colophon.
---

# Output formats

Set `format` to choose PNG, WebP, JPEG or AVIF. PNG is the default. For lossy
formats, `quality` controls encoding quality from 1 to 100:

```ts
export default defineConfig({
  format: "webp", // "png" (the default), "jpeg", "webp" or "avif"
  quality: 80, // the default; 1 to 100, ignored by png
});
```

Colophon renders the image, then encodes it in the requested format. This also
applies when you use a custom [rasteriser](../rasteriser/).

## What it saves

This benchmark rendered two posts at four sizes each, using default quality:

| Format | Whole build | A 1200x630 landscape |
| ------ | ----------- | -------------------- |
| `png`  | 396KB       | 82KB                 |
| `jpeg` | 188KB       | 30KB                 |
| `webp` | 112KB       | 18KB                 |
| `avif` | 92KB        | 16KB                 |

In this benchmark, WebP used about a quarter of the PNG space with similar
encoding time. AVIF produced smaller files but took longer to encode. Check
[platform support](#what-the-platforms-read) before choosing a format for
shared links.

The sample gradients retained their appearance at quality `80`. Below about
`50`, banding became visible. Compare your own images before lowering quality.

JPEG flattens transparent areas onto black. The built-in templates fill the
entire background, but custom templates may include transparency.

<a id="png-is-not-always-the-largest"></a>

### Flat-colour images

File size depends on the image. PNG can compress flat colour more efficiently
than JPEG. In the sample gallery, `card-wide-solid` was 19KB as PNG and 24KB as
JPEG. `theme-slate` was 7KB as PNG and 6KB as JPEG.

Across all 30 samples, at the default quality of 80:

| Format | The sample gallery |
| ------ | ------------------ |
| `png`  | 2300KB             |
| `jpeg` | 1002KB             |
| `webp` | 539KB              |
| `avif` | 496KB              |

JPEG was smaller across this mixed set of images. For a flat background with
a small amount of text, compare both formats before choosing.

## What the platforms read

Browser support does not guarantee support in social link previews. Test the
platforms your readers use.

[Joost de Valk's December 2024 tests](https://joost.blog/use-avif-webp-share-images/)
found AVIF previews on Facebook, Pinterest, Threads and WhatsApp. AVIF failed
on Bluesky, Discord, iMessage, LinkedIn, Mastodon, Slack and X.
[Darek Kay's tests](https://darekkay.com/blog/open-graph-image-formats/), updated
in November 2025, reported AVIF support only on Facebook, with incorrect
colours on WhatsApp.

These are dated test results. Recheck support before relying on AVIF for link
previews.

WebP worked on all eleven platforms in de Valk's tests and all except Xing
in Kay's tests. Tested support can exceed what a platform documents. Use PNG
or JPEG when your target platform's documented requirements call for them.

## The filenames follow

Filenames use the selected format's extension. WebP produces
`my-post-og.webp`, and JPEG uses `.jpg`.

Changing the format creates new filenames. Colophon keeps the old files,
which may still be used by existing links. Clear the output directory yourself
when those files are no longer needed.

A [`custom` placement](../placement/#custom-placements) supplies its own
filename. Keep that filename's extension consistent with `format`.

## Capping the size

Set `maxBytes` to a target output file size in bytes:

```ts
export default defineConfig({
  format: "webp",
  quality: 90,
  maxBytes: 5_000_000,
});
```

If a lossy image exceeds the cap, Colophon encodes it again at progressively
lower quality, in steps of ten points, down to `30`.

If the image still exceeds the cap at `30`, Colophon writes it and reports an
[`onWarning`](../warnings/) message:

```text
colophon: blog/post.md: Image is 31KB, over the 20KB maxBytes cap. Quality was
stepped down to 30, which is as far as it goes before the picture stops being
worth having. A smaller output size would do what quality no longer can.
```

The warning identifies an oversized image without stopping the build.

For PNG, `maxBytes` only reports a warning because PNG has no quality setting.
Use [`compressionLevel` or `quantise`](../compression/) to reduce PNG file
size. Compression is already at its strongest by default. Quantisation is
optional and reduces the number of colours.

## Writing the SVG too

```ts
export default defineConfig({
  emitSvg: true,
});
```

`emitSvg` writes the source SVG beside each image using the same base name.
For example, `my-post-og.png` gets `my-post-og.svg`.
[Hashed filenames](../placement/#content-hashed-filenames) keep the hash in
both filenames.

Use the SVG in a vector editor or compare it when changing a template. SVG
files are excluded from the [manifest](../manifest/) and have no
[rebuild stamp](../../rebuilds/). They are written when the corresponding image
is rendered.

<a id="they-all-change-every-images-stamp"></a>

## Rebuilds

`format`, `quality`, `maxBytes` and `emitSvg` are included in rebuild stamps.
Changing any of them regenerates the images. Enabling `emitSvg` therefore
writes SVG files for existing images too.

<a id="they-are-not-per-size"></a>

## Shared output settings

These encoding settings apply to the whole build. Individual sizes cannot
override them. See [Per-size config](../per-size-config/).
