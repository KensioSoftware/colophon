# Rasteriser

Colophon builds an SVG document per image and then turns it into bytes. That
second step is resvg by default, and `rasteriser` is how you replace it.

```ts
import { defineConfig, type Rasteriser } from "@kensio/colophon";

const myRasteriser: Rasteriser = async (svg, dimensions, config) => {
  // ...produce the image bytes for this document
  return bytes;
};

export default defineConfig({ rasteriser: myRasteriser });
```

Most projects should not need this. resvg is the default because it is what
makes the output reproducible: it takes explicit font files and can be told to
ignore whatever is installed on the machine, which is what
[Fonts](../fonts/) is built around.

## When you would want another

- **A wasm build**, so the same code runs at the edge or in a browser rather
  than needing a native binary.
- **Another encoder.** sharp reaches formats and quality settings resvg has no
  equivalent for.
- **Post-processing**, where you want the default output and something done to
  it, or the document changed before it is drawn.

## What a rasteriser is given

Three arguments: the finished SVG document, the dimensions to produce, and the
resolved config for that image.

The config is the whole resolved config rather than a shortlist, because which
parts matter is the backend's business. The ones that usually do are the font
settings:

| Field         | What it is                                                     |
| ------------- | -------------------------------------------------------------- |
| `fonts`       | The configured fonts, each as an absolute `path` or as `data`. |
| `systemFonts` | Whether installed fonts should be loaded as well.              |
| `fontFamily`  | The family to fall back to for a stack that matches no font.   |

A font may be configured as bytes rather than as a path. If your backend takes
file paths, `fontFilePaths` writes any such font to a temp file and gives you
the list:

```ts
import { fontFilePaths } from "@kensio/colophon";

const files = await fontFilePaths(config.fonts);
```

The SVG carries the same proportions as `dimensions`, so a backend that scales
by width alone lands on the right height anyway. That is what the default does.

## Wrapping the default

`resvgRasteriser` is exported, so you can delegate to it:

```ts
import { defineConfig, resvgRasteriser } from "@kensio/colophon";

export default defineConfig({
  rasteriser: (svg, dimensions, config) =>
    resvgRasteriser(watermark(svg), dimensions, config),
});
```

## It has to produce PNG, for now

A build records a rebuild stamp inside each image it writes, as a PNG `tEXt`
chunk, which is how it knows next time whether anything changed. Bytes it cannot
stamp are bytes it cannot write, so a rasteriser returning WebP or AVIF fails
with:

```
Cannot stamp: not a PNG image. The rebuild stamp is a PNG chunk, so a
rasteriser has to produce PNG for a build to be able to skip it.
```

Other output formats are their own piece of work, and the stamp is the part of
it that has to be solved. Until then this seam is for changing _how_ the PNG is
produced, not _what_ is produced. `renderMetaImages` has no such limit, since
nothing stamps there and the bytes are handed straight back to you.

## It changes every image

A different backend draws every pixel differently, so the rasteriser is part of
each image's rebuild stamp and changing it re-renders the whole tree. It is
recorded by its source text, which cannot see a value the function closed over,
so a rasteriser configured by something outside itself needs `--force` to pick
that change up. See [Rebuilds](../../rebuilds/).

## It is not per-size

Like `fonts`, a rasteriser is a shared build input rather than something an
individual output size can override. See
[Per-size config](../per-size-config/).
