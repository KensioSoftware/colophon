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
`colophon init` writes a starter one, and guesses where your content lives:

```bash
colophon init
```

```ts
// colophon.config.ts
import { defineConfig } from "@kensio/colophon";

export default defineConfig({
  colors: { brand: "#2563eb", brandDark: "#1e3a8a", brandWarm: "#f59e0b" },
  footer: "example.com",
  badge: { text: "npm" },
});
```

Or pick a [theme](../configuration/themes/) and let it choose the colours:

```ts
export default defineConfig({
  theme: "midnight",
  footer: "example.com",
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

```text
colophon [contentDir] [options]    Render the images for a content tree
colophon init [contentDir]         Write a starter config module
colophon preview <file> [options]  Render one post and open it

  -c, --config <path>   Config module whose default export is a ColophonConfig,
                        or a function returning one
  -f, --force           Re-render every image, ignoring the stamps
  -o, --overwrite       Alias for --force
  -n, --dry-run         Report what would change and write nothing
  -w, --watch           Rebuild whenever a content file changes
  --concurrency <n>     How many images to render at once
  --size <name>         Which configured size preview renders
  -h, --help            Show help

  contentDir            defaults to "content"
  --concurrency         defaults to one per available CPU
  --size                defaults to the first configured size
```

Images are rendered a few at a time rather than all at once, so a tree of a few
hundred posts does not start a few hundred rasterisations and thrash. The
default of one per available CPU suits a build machine with nothing else to do.
Lower it with `--concurrency` to leave room for whatever else is running.

While tuning a template, `colophon preview <file>` renders one post and opens
it, and `--watch` rebuilds the tree on every change. [The command
line](../cli/) covers all of it.

## Where to go next

- [The command line](../cli/) covers `init`, `preview`, dry runs and watching.
- [Templates](../templates/) covers the built-in layouts and how to add one.
- [Rebuilds](../rebuilds/) explains when an image is rendered again.
- [Programmatic use](../programmatic-use/) covers the API the CLI is built on.
