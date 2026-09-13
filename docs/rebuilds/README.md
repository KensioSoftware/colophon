---
description: How Colophon uses stamps inside generated images to skip unchanged images on later builds.
---

# Rebuilds

Colophon stores a rebuild stamp inside each generated image. The stamp is a
hash of the inputs used to render that image.

On later builds, Colophon compares the stored stamp with the current inputs.
It skips matching images and renders changed images again. Editing one post's
title therefore regenerates that post's images.

<a id="no-cache-to-keep-in-sync"></a>

## Skipping unchanged images

Stamps are stored in the image files, so there is no separate cache directory.
Deleting an image removes its stamp, and the next build recreates the image.

An existing image with a missing or outdated stamp is rendered again.

File existence alone is insufficient for skipping an image. Its stamp must
match the current inputs.

## Where the stamp goes

Colophon stores stamps in metadata appropriate to each supported output
format:

| Format | Where                                                  |
| ------ | ------------------------------------------------------ |
| PNG    | A `tEXt` chunk straight after the header.              |
| JPEG   | A `COM` segment, after any `APPn` and before the scan. |
| WebP   | A `CLPH` chunk appended to the RIFF file.              |
| AVIF   | A `uuid` box appended to the file.                     |

Adding a stamp preserves the decoded pixels, dimensions and colour
information. WebP and AVIF stamps are appended to avoid moving image data that
the format locates by its position in the file.

Reading a stamp requires up to 4KB from the appropriate end of the file.
Colophon can check the stamp without reading the full image.

`generate` rejects output formats it cannot stamp. See
[Rasteriser](../configuration/rasteriser/) for custom renderer requirements.

## What the stamp covers

Each stamp includes image props, resolved config, the output size and a digest
of Colophon's rendering code.

The rendering digest is computed when the package is built. It covers modules
used by the renderer, bundled fonts and the build-time versions of resvg,
sharp, shiki and fontkit. An upgrade that preserves this digest keeps existing
images. An upgrade that changes it regenerates them.

The digest covers whole files, including comments and validation code. Some
changes can therefore trigger a rebuild even when they leave the output
appearance unchanged.

The stamp excludes:

- `onWarning`, which controls how messages are handled.
- Unused sizes and templates. Only the size and template used by an image are
  included in that image's stamp.

[Per-size overrides](../configuration/per-size-config/) affect only that
size's stamp.

[`quantise`](../configuration/compression/) is included because it changes
the rendered colours.

Encoding and output settings are also included. Changing
[`compressionLevel`](../configuration/compression/),
[`format`, `quality`, `maxBytes` or `emitSvg`](../configuration/formats/)
regenerates images to apply the new output settings.

<a id="the-gap-and-the-way-out"></a>

## Forcing a rebuild

Templates are hashed using `render.toString()`, and custom rasterisers are
hashed the same way. This cannot detect changes to values captured outside a
function or files that the function reads itself. Built-in helper modules are
also covered by the rendering digest, but custom dependencies are not.

The digest records dependency versions used to build Colophon. It cannot
detect a consumer project updating rendering dependencies through its own
lockfile. Use `--force` after changing those dependencies or a custom
template's external inputs.

`--force` ignores stored stamps and renders every image:

```bash
colophon content --config colophon.config.ts --force
```

`--overwrite` is an alias for `--force`. In the API, use `generate`'s
`overwrite` option.

Use a [dry run](../cli/#dry-runs) to see which images are out of date without
rendering them:

```bash
colophon content --config colophon.config.ts --dry-run
```

## Hashed filenames

To give changed images new URLs, include the stamp in the filename with
[content hashed filenames](../configuration/placement/#content-hashed-filenames).
