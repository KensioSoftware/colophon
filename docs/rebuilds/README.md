# Rebuilds

Every image Colophon writes carries a stamp: a hash of the props, the config and
the output size it was rendered from, stored inside the image file itself.

On the next run, an image whose stamp still matches is left alone. One whose
title, colours, template or size has moved on is rendered again. Correcting a
single post's title therefore re-renders that post's images and nothing else.

## No cache to keep in sync

The stamp lives in the file it describes, so there is no cache directory and
nothing that can fall out of step. Delete an image and its stamp goes with it,
and the next run renders it fresh.

An image Colophon did not write has no stamp, so it is rendered over. So is one
written by an older version of the package.

Note that the decision is made from the stamp, not from whether the file exists.
An image that is present but stale is still re-rendered.

## Where the stamp goes

PNG is what the default rasteriser writes, and the other three are here for a
[rasteriser](../configuration/rasteriser/) that produces something else.

| Format | Where                                                  |
| ------ | ------------------------------------------------------ |
| PNG    | A `tEXt` chunk straight after the header.              |
| JPEG   | A `COM` segment, after any `APPn` and before the scan. |
| WebP   | A `CLPH` chunk appended to the RIFF file.              |
| AVIF   | A `uuid` box appended to the file.                     |

What a decoder gives back is unchanged in every case: the same pixels, at the
same size, with the same colour information. Two of the four are appended rather
than tucked in near the front,
which is not a preference: a plain WebP declares no room for a chunk before its
bitstream, and an AVIF locates its picture by an offset from the start of the
file that inserting anything earlier would move.

Reading a stamp back means reading 4KB from one end of a file or the other,
never the whole image. Reading a whole image to compare a hash against it would
cost about what rendering it again costs, and there would be no point skipping
anything.

A format that is none of these cannot be written at all, since an image with no
stamp is one every later build renders again without ever saying why.

## What the stamp covers

The stamp includes the props, the resolved config as that image saw it, the one
output size it was rendered at, and the Colophon version.

The version is in there because the built-in templates ship with the package, so
upgrading re-renders the tree once. Two things are deliberately left out:

- **`onWarning`**, because where a message goes cannot change a pixel.
- **The full `sizes` and `templates` lists.** Adding a third size, or an
  unrelated custom template, must not invalidate images that are already
  correct. The one size and the one template an image actually used go into that
  image's own stamp instead.

[Per-size overrides](../configuration/per-size-config/) are part of the stamp, so
changing one re-renders that size and leaves the others alone.

The things in the stamp that cannot change a pixel are
[`compressionLevel`](../configuration/compression/) and the
[output format settings](../configuration/formats/): `format`, `quality`,
`maxBytes` and `emitSvg`. They change every byte of every file instead, and
leaving them out would mean turning compression up, or dropping the quality, did
nothing to the images already on disk.

## The gap, and the way out

A custom template is covered by its own source code, hashed from
`render.toString()`. That cannot see anything the source does not name, so a
template that reads a closed-over value or loads a file itself can change
without Colophon noticing. A custom
[rasteriser](../configuration/rasteriser/) is covered the same way, and has the
same gap.

`--force` re-renders everything, ignoring the stamps:

```bash
colophon content --config colophon.config.ts --force
```

`--overwrite` is an alias for the same flag, and `generate` takes an
`overwrite` option that does the same thing.

To see which images the stamps make out of date without rendering any of them,
ask for a [dry run](../cli/#dry-runs):

```bash
colophon content --config colophon.config.ts --dry-run
```

## Hashed filenames

If you want a changed image to get a new URL rather than replacing an old one,
the stamp can also go into the filename. See
[content hashed filenames](../configuration/placement/#content-hashed-filenames).
