---
description: Replace or wrap the default resvg renderer to turn Colophon SVG documents into image bytes.
---

# Rasteriser

A rasteriser converts Colophon's SVG document into image bytes. Colophon uses
resvg by default. Set `rasteriser` to supply another implementation:

```ts
import { defineConfig, type Rasteriser } from "@kensio/colophon";

const myRasteriser: Rasteriser = async (svg, dimensions, config) => {
  // ...produce the image bytes for this document
  return bytes;
};

export default defineConfig({ rasteriser: myRasteriser });
```

The default resvg rasteriser accepts explicit font files and supports
disabling system fonts. See [Fonts](../fonts/) for these settings.

<a id="when-you-would-want-another"></a>

## When to use a custom rasteriser

Use a custom rasteriser to run a WebAssembly renderer in a browser or worker,
use another rendering backend, or post-process the SVG or rendered image. For
output encoding and PNG compression, first check the built-in
[format](../formats/) and [file size](../compression/) settings.

## What a rasteriser is given

The function receives the finished SVG string, the output dimensions and the
resolved config for the image.

The full resolved config is available. Font settings are often needed by a
rendering backend:

| Field         | What it is                                                     |
| ------------- | -------------------------------------------------------------- |
| `fonts`       | The configured fonts, each as an absolute `path` or as `data`. |
| `systemFonts` | Whether installed fonts should be loaded as well.              |
| `fontFamily`  | The family to fall back to for a stack that matches no font.   |

A font can be supplied as bytes or a path. If your backend requires paths,
use `fontFilePaths` to write in-memory fonts to temporary files:

```ts
import { fontFilePaths } from "@kensio/colophon";

const files = await fontFilePaths(config.fonts);
```

The SVG has the same aspect ratio as `dimensions`. A backend can scale it by
width and derive the corresponding height.

## Wrapping the default

Import `resvgRasteriser` to wrap the default renderer:

```ts
import { defineConfig, resvgRasteriser } from "@kensio/colophon";

export default defineConfig({
  rasteriser: (svg, dimensions, config) =>
    resvgRasteriser(watermark(svg), dimensions, config),
});
```

## It has to produce something that can be stamped

Images written by `generate` must support [rebuild stamps](../../rebuilds/).
A rasteriser must therefore return PNG, JPEG, WebP or AVIF. Unsupported bytes
cause this error:

```text
Cannot stamp: unrecognised image format. The rebuild stamp goes inside the
image, so a rasteriser has to produce one of PNG, JPEG, WebP, AVIF for a build
to be able to skip it.
```

See [where the stamp goes](../../rebuilds/#where-the-stamp-goes) for each
format. Adding the stamp preserves the decoded pixels, dimensions and colour
information.

The [`format`](../formats/) setting controls the final output format. Colophon
encodes the rasteriser's output into that format if needed. Bytes already in
the requested format skip this conversion.

`renderMetaImages` returns bytes without adding stamps, so the stamping format
restriction applies only when generating files.

<a id="it-changes-every-image"></a>

## Rebuilds

The rasteriser's source text is part of each image's rebuild stamp. Changing
the function regenerates the images. Changes to values captured outside the
function are not detected. Use `--force` after changing those values. See
[Rebuilds](../../rebuilds/).

<a id="it-is-not-per-size"></a>

## Shared rasteriser

All output sizes use the same rasteriser. It cannot be overridden
[per size](../per-size-config/).
