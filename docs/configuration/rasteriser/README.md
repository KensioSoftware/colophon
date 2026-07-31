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

Most projects should not need this. resvg is the default because it keeps the
output reproducible: it takes explicit font files and can be told to ignore
whatever is installed on the machine, which is what [Fonts](../fonts/) is built
around.

## When you would want another

- **A wasm build**, so the same code runs at the edge or in a browser rather
  than needing a native binary.
- **Another encoder**, for something the default cannot do, including another
  output format: see [what can be stamped](#it-has-to-produce-something-that-can-be-stamped)
  below. Note that a PNG a rasteriser returns is compressed again afterwards, so
  the compression resvg does not expose is already handled: see
  [File size](../compression/).
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

## It has to produce something that can be stamped

A build records a rebuild stamp inside each image it writes, which is how it
knows next time whether anything changed. Bytes it cannot stamp are bytes it
cannot write, so a rasteriser has to return one of the four containers a stamp
goes into: PNG, JPEG, WebP or AVIF. Anything else fails with:

```text
Cannot stamp: unrecognised image format. The rebuild stamp goes inside the
image, so a rasteriser has to produce one of PNG, JPEG, WebP, AVIF for a build
to be able to skip it.
```

See [Rebuilds](../../rebuilds/#where-the-stamp-goes) for where the stamp lands
in each of them. What a decoder gives back is unchanged in every case: the same
pixels, at the same size, with the same colour information.

A backend does not have to produce the format a build writes:
[`format`](../formats/) is what decides that, and whatever the rasteriser
returns is encoded into it afterwards. Bytes already in the configured format
are passed straight through, so a WebP backend under `format: "webp"` means one
encoding rather than two.

`renderMetaImages` has no limit at all here, since nothing stamps there and the
bytes are handed straight back to you.

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
