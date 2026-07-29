# Getting started

Colophon reads image props from a post's frontmatter and renders a PNG for each
output size you have configured.

## Install

```bash
pnpm add @kensio/colophon
```

Two dependencies come with it. `@resvg/resvg-js` rasterises the SVG to PNG, and
`shiki` provides the grammars and themes for the
[code template](../code-template/). No headless browser is involved.

You can hand the renderer font files rather than relying on what the machine has
installed, which is what makes a build render the same image everywhere. See
[Fonts](../configuration/fonts/).

## Describe the image in frontmatter

```yaml
---
title: My post
meta_img_props:
  template: banner
  title: "@kensio/colophon"
  subtitle: Generate social meta images from frontmatter
  version: 1.2.0
---
```

`meta_img_props` is the default key. [Frontmatter](../configuration/frontmatter/)
covers how to change it, and how to build props from fields your posts already
carry so you do not have to edit every file.

## Add a config file

Config is optional. Without one, Colophon renders with neutral defaults.

```ts
// colophon.config.ts
import { defineConfig } from "@kensio/colophon";

export default defineConfig({
  colors: { brand: "#2563eb", brandDark: "#1e3a8a", brandWarm: "#f59e0b" },
  footer: "example.com",
  badge: { text: "npm" },
});
```

Every option is listed in [Configuration](../configuration/).

## Run it over a content tree

```bash
colophon content --config colophon.config.ts
```

For every file that declares `meta_img_props`, Colophon writes one PNG per
output size next to the post, named `<slug>-<size>.png`. So `post/index.md`
produces `post/post-og.png` and `post/post-square.png`.

To write them somewhere else, such as a single `public/` directory served under
one URL prefix, see [Placement](../configuration/placement/).

## Command line options

```
colophon [contentDir] [options]

  -c, --config <path>   Config module whose default export is a ColophonConfig,
                        or a function returning one
  -f, --force           Re-render every image, ignoring the stamps
  -o, --overwrite       Alias for --force
  --concurrency <n>     How many images to render at once
  -h, --help            Show help

  contentDir            defaults to "content"
  --concurrency         defaults to one per available CPU
```

Images are rendered a few at a time rather than all at once, so a tree of a few
hundred posts does not start a few hundred rasterisations and thrash. The
default of one per available CPU suits a build machine with nothing else to do.
Lower it with `--concurrency` to leave room for whatever else is running.

## Where to go next

- [Templates](../templates/) covers the built-in layouts and how to add one.
- [Rebuilds](../rebuilds/) explains when an image is rendered again.
- [Programmatic use](../programmatic-use/) covers the API the CLI is built on.
