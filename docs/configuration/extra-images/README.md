# One-off images

Not every image belongs to a post. A package card or a repository social preview
wants the same brand and the same templates as the rest of the site, without
having a markdown file behind it. Listing them under `extra` has the build
render them alongside the tree:

```ts
export default defineConfig({
  colors: { brand: "#2563eb" },
  footer: "example.com",
  extra: [
    {
      props: {
        template: "banner",
        title: "@kensio/colophon",
        version: "2.0.0",
      },
      output: "public/npm-card.png",
    },
    {
      props: {
        template: "card",
        title: "colophon",
        subtitle: "social meta images",
      },
      output: "public/repo-preview.png",
      size: {
        name: "repo",
        width: 1280,
        height: 640,
        footer: "github.com/KensioSoftware/colophon",
      },
    },
  ],
});
```

## `output` is the whole path

It is the path to write, relative to the working directory, and any directories
it names are created.

An extra image has no post to sit beside, so `generate`'s `outputPath` callback
is not consulted and nothing is appended to the filename.

An extra that would land on another image in the same build stops it before
anything is written. Two images sharing a path do not merely lose one of
themselves: they each stamp the file, so neither stamp ever matches again and
both re-render on every build afterwards.

## `size` is an output size like any other

That includes [per-size overrides](../per-size-config/), which is how the
preview above gets its own footer without adding an entry to `sizes` that every
post would then be rendered at.

Leave `size` out and the image takes the first configured size, which for the
card above is the default `og` at 1200x630.

## Extras in the rest of the build

They are stamped and skipped exactly as content images are, so editing one
card's title re-renders that card and leaves the rest of the build alone.

They are reported by `onResult` too, with `contentPath` left `undefined`. There
is no post behind them to name, and naming them after their output path would
quietly break anything grouping results by post.

They are not listed in [the manifest](../manifest/), which is a map of pages. A
project that named the output path of an extra already knows where it is.
