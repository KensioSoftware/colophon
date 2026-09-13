---
description: Reduce Colophon PNG file sizes with compression and colour quantisation.
---

# File size

Use these settings to reduce PNG file sizes. For WebP, JPEG or AVIF, use
[`quality`](../formats/) instead.

`compressionLevel` reduces file size without changing pixels. `quantise`
reduces the number of colours for additional savings.

Colophon recompresses each rendered PNG. Set `compressionLevel` from 0 to 9,
with 9 as the default:

```ts
export default defineConfig({
  compressionLevel: 9, // the default; 0 to 9
});
```

The default rasteriser prioritises encoding speed. Recompressing at level 9
reduced a sample 1200x1200 gradient from about 400KB to 115KB and the repository's
sample gallery from 4.4MB to 1.7MB.

<a id="nothing-about-the-picture-changes"></a>

## Lossless compression

Recompression preserves the decoded pixels and PNG row filters. It changes
only how the image data is compressed.

There is no quality setting for lossless compression. Tests compare decoded
pixels and decompressed scanlines before and after recompression.

## What it costs

In the sample benchmark, level 9 added about 150ms per 1200x1200 image.

This cost applies only when an image is rendered. Images with matching
[rebuild stamps](../../rebuilds/) are skipped.

For a faster initial build, try level `6`. In the benchmark, it provided most
of the size reduction at about a tenth of the compression time:

| Level | Sample gallery | Time for the gallery |
| ----- | -------------- | -------------------- |
| `0`   | 4.4MB          | none                 |
| `6`   | 2.1MB          | 0.3s                 |
| `9`   | 1.7MB          | 3.1s                 |

Level `0` keeps the rasteriser's bytes unchanged. Values outside 0 to 9 cause
a config error. Recompression also leaves bytes unchanged if they are not a
PNG with readable chunks.

<a id="going-further-with-a-palette"></a>

## Palette quantisation

Set `quantise: true` to reduce each PNG to a palette of at most 256 colours.
It is disabled by default:

```ts
export default defineConfig({
  quantise: true,
});
```

Quantisation reduced the sample gallery from 1.7MB to 0.7MB. Individual files
were 28% to 61% of their recompressed sizes. In that benchmark, quantisation
took about 46ms per image compared with 151ms for lossless recompression.

<a id="what-it-trades-away-is-the-gradients"></a>

### Image quality

Quantisation can change pixels. The sample gallery's flat backgrounds kept
their exact colours, but gradients and meshes changed by up to about 17 levels
per colour channel out of 255. This can produce visible banding.

Inspect representative images before enabling quantisation for the whole
site. Transparent and translucent pixels are supported by the PNG palette.

Quantisation uses the installed [sharp](https://sharp.pixelplumbing.com/)
dependency. Lossless recompression works without sharp, including on machines
where its native binary is unavailable.

<a id="the-rebuild-stamp-survives-it"></a>

### Image metadata

Colophon preserves metadata chunks omitted by the palette encoder, including
the `tEXt` chunk containing the [rebuild stamp](../../rebuilds/) and a custom
rasteriser's `gAMA` chunk. If the encoder writes its own version of a chunk,
that version takes precedence.

<a id="both-settings-change-every-images-stamp"></a>

## Rebuilds

Both settings are included in rebuild stamps. Changing either regenerates
the images.

This applies to `compressionLevel` even though it preserves pixels. An image
must be written again to apply a different compression level.

<a id="they-apply-wherever-an-image-is-produced"></a>

## Rendering entry points

The same PNG processing runs for `generate`, the CLI, `colophon preview` and
`renderMetaImages`.

It also processes PNGs from a custom [rasteriser](../rasteriser/). Other output
formats pass through this step unchanged.

<a id="they-are-not-per-size"></a>

## Shared output settings

Compression and quantisation settings apply to all sizes in a build. They
cannot be overridden [per size](../per-size-config/).
