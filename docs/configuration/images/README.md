# Logos, avatars and photographs

Three places an image can go into a generated one: a logo in the corner, an
author's photo beside the footer, and a photograph behind everything.

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

A post supplies its own author photo through the `avatar` prop:

```yaml
---
meta_img_props:
  template: card
  title: Measuring text properly
  avatar: content/authors/hugh.jpg
---
```

## Where they come from

Anywhere `path` appears you can write `data` instead and pass the bytes, which
is what a config that fetches its logo at build time wants. Paths resolve from
the working directory, as [`fonts`](../fonts/) do, and are checked when the
config is resolved rather than when the image is drawn: an unreadable file is a
blank corner on every image in the build, and a blank corner does not say which
path was wrong.

The bytes are inlined into the SVG as a `data:` URI, so a generated image never
depends on a file being fetchable later, and they go into the
[rebuild stamp](../../rebuilds/) by content. Replacing a logo at the same path
renders every image drawn with it again.

## Formats

PNG, JPEG, GIF, WebP and SVG. The format is read from the bytes rather than the
file extension, so a `.png` that is really a JPEG is still drawn.

**Text inside an SVG is not rendered.** A nested document is drawn without the
fonts the build loaded, so a wordmark comes out with its shapes and none of its
letters. Convert the text to paths before exporting it, or use a PNG.

## How big they come out

A logo's height is a fraction of the image being drawn, so the same file works
on a square and a landscape, and its width follows from the proportions of the
picture. Those are read out of the image's own header, which is why a wide
wordmark gets a wide slot and a round mark gets a square one.

WebP is the exception: its dimensions live in one of three chunk layouts
depending on how it was encoded, and rather than guess at bit-packed headers
this treats a WebP as square. A wide WebP logo will sit small in the middle of
its slot, so supply a wide logo as PNG or SVG.

## Where they are drawn

That is the template's business, and the built-ins put them here:

| Template | Logo                          | Avatar            |
| -------- | ----------------------------- | ----------------- |
| `banner` | Top right, opposite the badge | Before the footer |
| `card`   | Top centre, above the title   | Before the footer |
| `code`   | Not drawn                     | Not drawn         |

The text moves down to make room for a logo, so a title never runs into it.

A [template of your own](../../templates/) is handed both on its context, as
`logo` and `avatar`, already loaded, along with the `image` primitive from
[the layout toolkit](../../layout/) to draw them with.

## Photographs behind the text

A background image takes a `fit`: `cover` fills the image and crops whatever
does not fit, `contain` fits the whole picture in and shows `color` around it.

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

A photograph is light and dark wherever it likes, and white text over a bright
sky cannot be read. The scrim is the wash of colour between the picture and the
text, and it is the difference between a designed image and text sitting on a
photo.

It defaults to a quarter of black at the top and about two thirds at the
bottom. It starts at a quarter rather than at nothing because a template is
free to put its text anywhere, and a wash that only darkens the bottom leaves a
centred title sitting on whatever the middle of the photograph happens to be.

Turn it down for a picture that is already dark, or off entirely:

```ts
scrim: { from: 0, to: 0 }
```

Set `color` to tint rather than shade: a brand colour at a low opacity over a
photograph is what makes a set of images look like they belong together.

## Per size

`logo` and `background` are both [per-size overrides](../per-size-config/), so a
tall Pinterest pin can carry a different photograph, or none:

```ts
sizes: [
  SIZE_PRESETS.og,
  { ...SIZE_PRESETS.square, background: { type: "solid", color: "#0f172a" } },
],
```
