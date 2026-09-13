---
description: Add logos and photographs to Colophon image templates and backgrounds.
---

# Logos, avatars and photographs

Colophon supports a shared logo, author avatars and post photographs. You can
also place a photograph behind the template using `background`:

```ts
export default defineConfig({
  logo: { path: "brand/logo.svg" },
  background: {
    type: "image",
    source: { path: "brand/cover.jpg" },
    fit: "cover",
  },
});
```

Set `avatar` or `image` in a post's image props to use a file path or `data:`
URI:

```yaml
---
meta_img_props:
  template: photo
  title: Measuring text properly
  avatar: content/authors/hugh.jpg
  image: content/posts/measuring/hero.jpg
---
```

A background image is a config setting shared by posts. The `image` prop
belongs to an individual post and is used by templates such as
[`photo`](../../templates/).

## Where they come from

An image source can use `{ path }` or `{ data }`. Use `data` for bytes already
in memory. Relative paths are resolved from the working directory, as with
[fonts](../fonts/). Config image paths are checked when the config is resolved.

Image bytes are embedded in the SVG as `data:` URIs. Their contents are also
included in [rebuild stamps](../../rebuilds/). Replacing a logo at the same
path regenerates images that use it.

## Formats

Supported formats are PNG, JPEG, GIF, WebP and SVG. Colophon detects the format
from the bytes, even if the file extension differs.

Convert text inside an SVG to paths before using it, or supply a PNG. Nested
SVG text cannot use the build's loaded fonts and may be missing from the
rendered image.

## How big they come out

Logo height scales with the output image. Width follows the source image's
aspect ratio, read from its header.

WebP logos are treated as square because their dimensions are not read. A wide
WebP logo can appear too small. Use PNG or SVG for a wide logo.

## Where they are drawn

Each template chooses the image positions:

| Template   | Logo                           | Avatar             |
| ---------- | ------------------------------ | ------------------ |
| `banner`   | Top right, opposite the badge  | Before the footer  |
| `card`     | Top centre, above the title    | Before the footer  |
| `code`     | Not drawn                      | Not drawn          |
| `article`  | Top right, beside the tags     | Before the byline  |
| `quote`    | Not drawn                      | Before the speaker |
| `terminal` | Not drawn                      | Not drawn          |
| `release`  | Top right                      | Before the footer  |
| `stat`     | Top centre                     | Before the footer  |
| `photo`    | Top right, over the photograph | Before the footer  |
| `wordmark` | Centred, above the name        | Before the footer  |
| `docs`     | Top right, beside the trail    | Before the footer  |
| `event`    | Top centre                     | Before the footer  |

Templates reserve space for logos before placing text.

A [custom template](../../templates/) receives loaded assets as `logo`,
`avatar` and `picture` in its context. Use the
[layout toolkit's image function](../../layout/) to draw them. `picture` holds
the post's `image` prop.

## Photographs behind the text

For a background image, `fit: "cover"` fills the output and crops excess
content. `fit: "contain"` shows the whole image with `color` filling any
remaining space.

```ts
background: {
  type: "image",
  source: { path: "brand/cover.jpg" },
  fit: "contain",
  color: "#0f172a",
  scrim: { from: 0.3, to: 0.8 },
}
```

### The scrim is on by default

A scrim is a translucent colour layer between the photograph and text. It
improves contrast when text overlaps bright areas.

The default scrim is black, with opacity increasing from about one quarter at
the top to two thirds at the bottom.

Reduce the scrim for a dark photograph, or disable it:

```ts
scrim: { from: 0, to: 0 }
```

Set `color` to a brand colour to tint the photograph.

## Per size

`logo` and `background` support [per-size overrides](../per-size-config/).
This example gives a Pinterest image its own background:

```ts
sizes: [
  SIZE_PRESETS.og,
  { ...SIZE_PRESETS.square, background: { type: "solid", color: "#0f172a" } },
],
```
