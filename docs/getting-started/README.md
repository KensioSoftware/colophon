# Getting started

Colophon reads image props from a post's frontmatter and renders a PNG for each
output size you have configured.

## Install

```bash
pnpm add @kensio/colophon
```

Two dependencies come with it: `@resvg/resvg-js`, which rasterises the SVG to
PNG, and `shiki`, which provides the grammars and themes for the
[code template](../code-template/). There is no headless browser to install.

You can hand the renderer font files rather than relying on what the machine has
installed, so that a build renders the same image wherever it runs. See
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
colophon playground [file] [options]
                                   Print a configured playground link

  -c, --config <path>   Config module whose default export is a ColophonConfig,
                        or a function returning one
  -f, --force           Re-render every image, ignoring the stamps
  -o, --overwrite       Alias for --force
  -n, --dry-run         Report what would change and write nothing
  -w, --watch           Rebuild whenever a content file changes
  --concurrency <n>     How many images to render at once
  --size <name>         Which configured size preview renders, or the
                        playground link opens
  -h, --help            Show help

  contentDir            defaults to "content"
  --concurrency         defaults to one per available CPU
  --size                defaults to the first configured size
```

Images are rendered a few at a time rather than all at once, so that a tree of a
few hundred posts does not start a few hundred rasterisations. The
default of one per available CPU suits a build machine with nothing else to do,
and `--concurrency` lowers it to leave room for whatever else is running.

The number a build actually reaches is capped by the libuv thread pool, which
holds four threads unless `UV_THREADPOOL_SIZE` says otherwise. Rasterising, PNG
recompression and quantising all run there, so on a machine with more than four
cores the default concurrency is above what the pool can serve, and the build
says so. Node sizes the pool from the environment before the process starts:

```bash
UV_THREADPOOL_SIZE=16 colophon content
```

On an eighteen-core machine, 200 pages at 1200x630 took 24 seconds at the
default pool and 13.8 seconds with the pool at 16. Past about the core count the
curve flattens. [The command line](../cli/#the-thread-pool) has the detail.

While tuning a template, `colophon preview <file>` renders one post and opens
it, and `--watch` rebuilds the tree on every change. [The command
line](../cli/) covers both.

## Where to go next

- [The command line](../cli/) covers `init`, `preview`, dry runs and watching.
- [Templates](../templates/) covers the built-in layouts and how to add one.
- [Rebuilds](../rebuilds/) explains when an image is rendered again.
- [Programmatic use](../programmatic-use/) covers the API the CLI is built on.
