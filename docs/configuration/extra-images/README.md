---
description: Generate standalone social images from Colophon config without a Markdown post.
---

# One-off images

Use `extra` to generate standalone images, such as a package card or repository
social preview. Each entry supplies its own props and output path:

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

`output` is the complete output path, relative to the working directory.
Colophon creates any missing parent directories.

Extra images use the supplied filename exactly. They bypass `generate`'s
`outputPath` callback.

If an extra image would share an output path with another image, Colophon
stops the build before writing any images.

## `size` is an output size like any other

The `size` object accepts [per-size overrides](../per-size-config/). The
example above gives the repository preview its own footer without changing
the sizes generated for posts.

If `size` is omitted, the extra image uses the first configured size. With the
default config, this is `og` at 1200x630.

## Extras in the rest of the build

Extra images use rebuild stamps. Changing one card's title renders that card
again while leaving unchanged images alone.

`onResult` receives results for extra images with `contentPath` set to
`undefined`.

Extra images are excluded from [the manifest](../manifest/). Use their
configured output paths directly.
