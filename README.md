# @kensio/colophon

Generate social meta images (Open Graph / share-card images) for the posts of a
static website, driven by each post's frontmatter.

You describe an image in frontmatter — `title`, `subtitle`, `version`, a
template name — and Colophon renders branded PNGs at the sizes you need. The
name comes from the printer's _colophon_: the emblem a publisher stamps on a
finished work.

- **Frontmatter-driven** — general props read from a post, not a fixed schema.
- **Templates** — a small registry of layouts; frontmatter picks one.
- **Syntax-highlighted code images** — the `code` template renders a snippet
  from frontmatter with real VS Code theme colours.
- **Configurable branding** — colours, gradient, fonts, footer and badge come
  from config, not from any one site's stylesheet.
- **Multiple sizes from one input** — a 1:1 square plus a 1.91:1 landscape by
  default, or whatever set you configure.
- **Small, reusable API** — a render core with no filesystem concerns, plus an
  optional content walker and CLI.

## Install

```bash
pnpm add @kensio/colophon
```

`@resvg/resvg-js` is a dependency and does the SVG → PNG rasterisation; `shiki`
provides the grammars and themes for the `code` template. No headless browser is
involved, and fonts can be handed to the renderer as files (see
[Fonts](#fonts)) so a build renders the same image everywhere.

## Quick start (CLI)

Add image props to a post's frontmatter:

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

Create a config module (optional — omit to use the neutral defaults):

```ts
// colophon.config.ts
import { defineConfig } from "@kensio/colophon";

export default defineConfig({
  colors: { brand: "#2563eb", brandDark: "#1e3a8a", brandWarm: "#f59e0b" },
  footer: "example.com",
  badge: { text: "npm" },
});
```

Run it over a content tree:

```bash
colophon content --config colophon.config.ts
```

For every file that declares `meta_img_props`, Colophon writes one PNG per
output size next to it, named `<slug>-<size>.png`
(`post/index.md` → `post/post-og.png` and `post/post-square.png`).

```
colophon [contentDir] [options]

  -c, --config <path>   Config module whose default export is a ColophonConfig
  -f, --force           Re-render every image, ignoring the stamps
  -o, --overwrite       Alias for --force
  --concurrency <n>     How many images to render at once
  -h, --help            Show help

  contentDir            defaults to "content"
  --concurrency         defaults to one per available CPU
```

Images are rendered a few at a time rather than all at once, so a tree of a few
hundred posts does not start a few hundred rasterisations and thrash. The
default — one per CPU the process can use — suits a build machine that has
nothing else to do; lower it with `--concurrency` to leave room for whatever
else is running.

### Rebuilds

Every image Colophon writes carries a stamp — a hash of the props, the config
and the output size it was rendered from, stored in the PNG itself as a `tEXt`
chunk. On the next run an image whose stamp still matches is left alone, and
one whose title, colours, template or size has moved on is rendered again. So
correcting a single post's title re-renders that post's images and nothing
else.

There is no cache directory and nothing to keep in sync: delete an image and
its stamp goes with it. An image Colophon did not write, or one written by an
older version, has no stamp and is rendered over.

The stamp covers the Colophon version too, since the built-in templates ship
with it — upgrading the package re-renders the tree once. A custom template is
covered by its own source code, which means a template that reads something its
source does not name (a closed-over value, a file it loads itself) can change
without being noticed; `--force` is the way out.

## Programmatic use

### Render from props (core)

The core takes props and config and returns rendered bytes — no filesystem, no
content discovery:

```ts
import { renderMetaImages } from "@kensio/colophon";
import { writeFile } from "node:fs/promises";

const images = await renderMetaImages(
  {
    template: "banner",
    title: "@kensio/colophon",
    subtitle: "Generate social meta images from frontmatter",
    version: "1.2.0",
  },
  {
    colors: { brand: "#2563eb" },
    footer: "example.com",
    badge: { text: "npm" },
  },
);

for (const image of images) {
  // image.name is the output-size name ("og", "square", …).
  await writeFile(`social-${image.name}.png`, image.png);
}
```

### Walk content + generate (host helpers)

`walkContent` finds `.md` files and reads their frontmatter; `generate` ties
walking, rendering and writing together (this is what the CLI uses):

```ts
import { generate } from "@kensio/colophon";

await generate({
  contentDir: "content",
  config: { colors: { brand: "#2563eb" } },
  overwrite: false,
  concurrency: 4, // defaults to one per available CPU
  onResult: (result) =>
    // result.url is where it is served, when the placement knows.
    console.log(`${result.skipped ? "skip" : "wrote"} ${result.outputPath}`),
});
```

Import the walker on its own from the `@kensio/colophon/content` subpath if you
only want frontmatter discovery.

## Templates

| Name     | Layout                                                                       |
| -------- | ---------------------------------------------------------------------------- |
| `banner` | Left-aligned title with optional version, subtitle, corner badge and footer. |
| `card`   | Minimal centred title with an optional subtitle.                             |
| `code`   | Syntax-highlighted snippet on a rounded panel over the background.           |

Register your own by passing `templates` in config — a template is `{ name,
render(context) }` returning SVG foreground content, either directly or as a
promise. Anything you add merges over (and can override) the built-ins.

### The `code` template

Put the snippet in frontmatter and name its language:

```yaml
---
title: eslint changed TypeScript files only
slug: eslint-changed-ts-files-only
meta_img_props:
  template: code
  language: bash
  code: |
    mapfile -t CHANGED_TS < <(
      git diff origin/main --name-only \
        | grep '\.ts'
    )
---
```

| Prop       | Notes                                                            |
| ---------- | ---------------------------------------------------------------- |
| `code`     | The snippet. Trimmed, tabs expanded, common indentation removed. |
| `language` | Any [Shiki language]; unknown names fall back to plain text.     |
| `title`    | Optional heading above the panel. Omit for a bare code image.    |
| `theme`    | Optional per-post override of `config.code.theme`.               |

[Shiki language]: https://shiki.style/languages

Pygments-style names carried over from an older pipeline (`text`, `console`,
`html+handlebars`, …) are mapped onto their Shiki equivalents, so existing
frontmatter usually needs no changes.

The font size is fitted to the snippet: Colophon measures the longest line and
the line count against a monospace grid and picks the largest size that fits on
both axes, within `minFontScale`/`maxFontScale`. Those bounds are fractions of
the image _width_, because that is what a feed scales a share image to — a
landscape image would otherwise render the same snippet at half the size of its
square counterpart. Code too long to fit at the floor is truncated with an
ellipsis rather than shrunk into unreadability, and the panel then shrinks onto
what's left so the code isn't marooned in a larger box.

That trade matters most on the landscape sizes, which have around half the
vertical room of the square: at the default floor an Open Graph image fits
roughly nine lines of about sixty characters. Snippets written to that budget
render identically at every size; longer ones keep their opening lines and lose
the tail. Lower `minFontScale` if you would rather show the whole snippet small.

Nothing in a finished image says the sample continued, so Colophon says it for
you — a snippet that had to lose lines is reported through `onWarning`:

```
colophon: content/post/index.md: code snippet does not fit the 1200x630 image at
a legible size: 4 of 13 lines dropped. Shorten the sample, or lower
code.minFontScale to fit it in smaller.
```

A snippet's leading indentation is dropped before any of this, so lifting a
sample out of a nested block costs you no width.

Styling comes from `config.code`:

```ts
export default defineConfig({
  colors: { brand: "#2563eb" },
  footer: "example.com",
  code: {
    theme: "night-owl", // any bundled Shiki theme
    fontFamily: '"JetBrains Mono", monospace',
    charWidthRatio: 0.6, // glyph advance ÷ font size, for your monospace face
    lineHeight: 1.55,
    tabSize: 2,
    cornerScale: 0.025,
    maxFontScale: 0.075, // fractions of the image width
    minFontScale: 0.025,
  },
});
```

`charWidthRatio` is how the layout knows where each token sits, so it must match
the font actually used — `0.6` suits most monospace faces (Source Code Pro,
Menlo, DejaVu Sans Mono); Consolas wants about `0.55`. Give the monospace face
as a file under `fonts` so the ratio you set is the ratio you get; the default
stack ends in the generic `monospace` family so it resolves to something
whatever the machine has.

## Configuration

All fields are optional; sensible defaults apply.

| Option        | Default                        | Notes                                               |
| ------------- | ------------------------------ | --------------------------------------------------- |
| `colors`      | neutral indigo/pink            | `brand`, `brandDark`, `brandWarm`, `foreground`.    |
| `background`  | gradient derived from `colors` | Or a `{ type: "solid" }` / custom gradient.         |
| `fonts`       | none                           | Font files to render with (see below).              |
| `systemFonts` | `true` until `fonts` is set    | Whether installed fonts are loaded too.             |
| `fontFamily`  | first font, else `Arial, …`    | Font stack for template text.                       |
| `footer`      | none                           | Footer text; omit the field for none.               |
| `badge`       | none                           | Corner badge for `banner`; omit the field for none. |
| `code`        | `github-dark`, monospace stack | Styling for the `code` template (see above).        |
| `onWarning`   | `console.warn`                 | Where compromises are reported (see below).         |
| `sizes`       | `og` + `square`                | Named output sizes, each able to override config.   |
| `templates`   | `banner`, `card`, `code`       | Merged over the built-ins.                          |
| `content`     | `meta_img_props`, `.md` files  | How props are read from the tree (see below).       |
| `placement`   | `beside-content`               | Where images go and what URL they get (see below).  |
| `extra`       | none                           | One-off images not tied to a post (see below).      |

### Unknown options

The config is closed: an option Colophon does not recognise stops the build
rather than being ignored. A key nobody reads is otherwise a build that
succeeds and images that are wrong — the default sizes, the default colours,
and nothing in the log to say why.

```
Unknown option "dimensions". Did you mean "sizes"?
```

Where there is an obvious near miss it is named, including options that have
been renamed between versions; where there is not, the message lists what is
valid at that point in the config. Nested objects are checked too and named by
their path — `code.tabsize`, `sizes[1].heigth`, `background.stops[0].ofset` —
and everything wrong with a config is reported in one go rather than one run
at a time.

Two parts stay open on purpose: the names under `templates` are your own, and a
post's props are read by whichever template understands them.

### Fonts

By default Colophon names font families and hopes the machine has them, which
is how the same post ends up rendering differently on a laptop, in CI and in a
container. Point `fonts` at font files instead and the output stops depending
on the machine:

```ts
export default defineConfig({
  fonts: [
    { family: "Inter", path: "./fonts/Inter-Regular.ttf" },
    { path: "./fonts/Inter-Bold.ttf" },
    { path: "./fonts/JetBrainsMono-Regular.ttf" },
  ],
  code: { fontFamily: "JetBrains Mono" },
});
```

- **One entry per file.** Weight and style are read from the font itself, so a
  regular and a bold face are two entries and the template's `font-weight`
  picks between them. Supply the bold face: templates ask for weights up to
  `900` for titles and badges, and a missing weight is drawn with the face you
  did supply rather than being synthesised into a fake bold.
- **`family` is optional** and doesn't affect matching — the family name inside
  the file does that. Naming it on the first font saves setting `fontFamily`,
  which otherwise stays on the default stack.
- **Paths are files**, `.ttf`, `.otf`, `.ttc` or `.otc`, resolved from the
  working directory when relative. A path that isn't there is an error rather
  than a silently blank image. To load a font you already have in memory —
  fetched at build time, or bundled — pass `{ data }` with its bytes instead.
- **System fonts switch off** as soon as you configure any font, so a family
  you didn't supply can't quietly resolve to something installed. Set
  `systemFonts: true` to have both, at the cost of the determinism you came
  for.

An unknown family falls back to a configured font rather than rendering
nothing, so a mismatched name shows up as the wrong typeface, not a blank
image.

### Warnings

Some inputs can't be honoured exactly — code too long to render legibly, so far.
Colophon renders anyway and reports the compromise through `onWarning`, which
defaults to `console.warn`. Pass your build's logger to route them, or a no-op
to silence them:

```ts
export default defineConfig({
  onWarning: () => {},
});
```

`generate` prefixes each message with the content file it came from, so a build
over a whole tree still names the post to fix.

### Output sizes and filenames

Each output size is a named `{ name, width, height }`. The `name` becomes the
filename suffix, so every image is distinct: `my-post-og.png`,
`my-post-square.png`. The default set is one 1.91:1 Open Graph landscape and one
1:1 square, which between them satisfy `og:image` and both `twitter:image` card
types (`summary_large_image` reuses the landscape; `summary` uses the square).

`SIZE_PRESETS` ships the common standards — compose your own set:

```ts
import { defineConfig, SIZE_PRESETS } from "@kensio/colophon";

export default defineConfig({
  sizes: [
    SIZE_PRESETS.og, // 1200×630 — og:image (Facebook, LinkedIn, Slack, …)
    SIZE_PRESETS.square, // 1200×1200 — Twitter summary card, universal
    SIZE_PRESETS.twitter, // 1200×600 (2:1) — Twitter summary_large_image
    SIZE_PRESETS.pinterest, // 1000×1500 (2:3) — Pinterest
    { name: "hero", width: 1600, height: 900 }, // or anything custom
  ],
});
```

The base filename is the **post slug**: Colophon reads a top-level `slug` from
frontmatter (SEO-friendly, keyword-rich), falling back to the file name — or the
parent directory for `index.*` files. Point `slugField` at a different key, or
override naming entirely with `generate`'s `outputPath` callback.

#### Slug strategies

Two ways to derive a slug from a path, for sites that address content
differently. `basename` is the default and unchanged:

| Path                    | `basename` | `route`        |
| ----------------------- | ---------- | -------------- |
| `index.md`              | `index`    | `index`        |
| `blog/my-post.md`       | `my-post`  | `blog/my-post` |
| `services/iam/index.md` | `iam`      | `services/iam` |

`basename` suits Hugo-style page bundles, where the image belongs beside its
post. `route` suits a site addressed by route — a docs tree where
`services/iam/index.md` is served at `/services/iam` and wants an image named to
match:

```ts
export default defineConfig({
  content: { slugStrategy: "route" },
});
```

A slug carrying directories is written from the **content root** rather than
beside the file, so `services/iam` becomes `content/services/iam-og.png`.
Resolving it beside the file would repeat the directories already in the slug.
A frontmatter `slug` still wins over either strategy.

### Placement

`outputPath` says where the bytes go and nothing about how anyone reaches them,
so every site rebuilds that mapping in its own templates — from information
Colophon had while generating and threw away. A placement says both:

```ts
export default defineConfig({
  // Astro, Eleventy, Vite: one directory, served under one prefix.
  placement: { strategy: "public-dir", dir: "public/og", urlBase: "/og" },
});
```

```
wrote public/og/my-post-og.png -> /og/my-post-og.png
```

| Strategy         | Writes                                | Suits                   |
| ---------------- | ------------------------------------- | ----------------------- |
| `beside-content` | Next to the post, as it always has    | Hugo-style page bundles |
| `public-dir`     | Into `dir`, one directory for the lot | Astro, Eleventy, Vite   |
| `custom`         | Wherever `path` says                  | Anything else           |

The URL comes from `urlBase`, prefixed to the image's path under whatever root
placed it. **No `urlBase`, no URL** — a directory on disk does not say how, or
whether, it is served, and a URL Colophon invented would be worse than the gap
it fills. It can be site-relative (`/og`) or absolute, for images on a CDN.

`custom` works both halves out itself, for a mapping that is nobody else's —
images under a dated directory, say:

```ts
placement: {
  strategy: "custom",
  path: (file, size) => `public/og/2026/${file.slug}-${size.name}.png`,
  url: (file, size) => `/og/2026/${file.slug}-${size.name}.png`,
}
```

Each result carries the URL as `result.url`, `undefined` where nothing says:
no `urlBase`, an image placed by `generate`'s `outputPath` callback (which
still wins, and then the placement no longer describes where the file went), or
an `extra` that named its own path.

A flat placement makes filename collisions much easier to hit — two posts named
`intro.md` in different sections both want `public/og/intro-og.png`. Colophon
refuses the build and names both posts rather than letting one overwrite the
other, which would also leave the pair re-rendering on every build. Pair
`public-dir` with `slugStrategy: "route"` and each post keeps its section:

```ts
export default defineConfig({
  content: { slugStrategy: "route" },
  placement: { strategy: "public-dir", dir: "public/og", urlBase: "/og" },
});
// public/og/blog/intro-og.png -> /og/blog/intro-og.png
```

### Per-size config

Some settings only make sense per size. `code.minFontScale` is the clearest
case: a 1:1 square and a 1.91:1 landscape have very different amounts of
vertical room, so a snippet that fits one gets truncated in the other. A size
can carry its own overrides, applied only when rendering it:

```ts
export default defineConfig({
  colors: { brand: "#2563eb" },
  code: { theme: "github-dark" },
  sizes: [
    SIZE_PRESETS.square,
    { ...SIZE_PRESETS.og, code: { minFontScale: 0.013 } },
  ],
});
```

One pass over the content tree, one config file. The alternative is running
`generate` once per size with a different config each time, which re-walks and
re-parses everything for each.

Overridable: `colors`, `background`, `fontFamily`, `footer`, `badge`, `code` —
what a template reads while drawing. Not overridable: `fonts`, `systemFonts` and
`templates`, which are shared build inputs rather than part of the picture, and
`onWarning`, which is where messages go rather than what they say. A size naming
one of those is an unknown-option error, not a setting that quietly does
nothing. `fontFamily` is overridable because it picks from the fonts already
loaded; supplying different font _files_ per size is not the same thing.

`colors` and `code` **merge** over their config-level counterparts, so the
example above keeps `github-dark` and changes only the minimum font size. Any
single shade can be overridden on its own — `colors: { foreground: "#111827" }`
on one size keeps the brand palette and changes just the text colour. The
rest **replace**: a `background` is a union whose variants have different keys,
so merging half of one onto half of another would produce a background that is
neither, and `badge` carries a required `text` a partial override could not
supply.

Overrides are part of an image's rebuild stamp, so changing one re-renders that
size and leaves the others alone.

### One-off images

Not every image belongs to a post. A package card, a repository social preview
and a home page share image all want the same brand and the same templates, and
none of them has a markdown file behind it. List them under `extra` and the
build renders them alongside the tree:

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

`output` is the path to write, relative to the working directory, and any
directories it names are created. It is the whole path: an extra image has no
post to sit beside, so `generate`'s `outputPath` callback is not consulted and
nothing is appended to the filename. An extra that would land on another image
in the same build stops it before anything is written — two images sharing a
path do not merely lose one of themselves, they each stamp the file and so
re-render on every build afterwards.

`size` is an output size like any other, [overrides](#per-size-config) and all —
that is how the preview above gets its own footer without adding an entry to
`sizes` that every post would then be rendered at. Leave it out and the image
takes the first configured size, which for the card above is the default `og`
1200×630.

Extras are stamped and skipped exactly as content images are, so editing one
card's title re-renders that card and leaves the rest of the build alone. They
are reported by `onResult` too, with `contentPath` left `undefined`: there is no
post behind them to name.

### Frontmatter shape

By default Colophon reads a `meta_img_props` object and a `template` field
within it, plus a top-level `slug`. All are configurable under `content`
(`propsKey`, `templateField`, `defaultTemplate`, `slugField`, `slugStrategy`,
`extensions`) so you can match an existing convention.

### Using the frontmatter you already have

A site with 200 existing posts gets no images until someone adds a props block
to 200 files. Most posts already carry the fields an image needs, just under
different names — so map them instead:

```ts
export default defineConfig({
  content: {
    defaultTemplate: "banner",
    props: (frontmatter) =>
      frontmatter.draft === true
        ? undefined
        : { title: frontmatter.title, subtitle: frontmatter.description },
  },
});
```

Point it at your content directory and the site gets its images, without
editing a single post.

**Returning `undefined` skips a post.** That is the filter for drafts, section
indexes and anything else in the tree that is not a page worth sharing —
without it, mapping frontmatter means an image for every markdown file there
is.

**An explicit props block still wins, field by field.** A post that wants a
different subtitle writes just that:

```yaml
---
title: Colophon 2.3.0
description: Autogenerated release notes
meta_img_props:
  subtitle: Per-size config, frontmatter mapping
---
```

The title still comes from the mapper; only the subtitle is overridden. A post
declaring a block is never skipped, even if the mapper would have skipped it —
asking for an image outright is the stronger signal.

`content` lives in the config module because a `props` mapper is a function and
cannot be passed as a CLI flag. `generate`'s `walk` option is the programmatic
equivalent and takes precedence where both are given.

## Sample output

These are generated by [`scripts/gen-samples.ts`](scripts/gen-samples.ts) — run
`pnpm samples` to regenerate them after changing a template, then commit the
updated PNGs so this gallery stays in sync.

<table>
  <tr>
    <td width="50%">
      <img src="docs/samples/banner-square.png" alt="banner template, square" width="100%" /><br />
      <sub><code>banner</code> · 1200×1200 · gradient, badge, version, subtitle, footer</sub>
    </td>
    <td width="50%">
      <img src="docs/samples/card-square.png" alt="card template, square" width="100%" /><br />
      <sub><code>card</code> · 1200×1200 · centred title and subtitle</sub>
    </td>
  </tr>
  <tr>
    <td>
      <img src="docs/samples/banner-wide.png" alt="banner template, landscape" width="100%" /><br />
      <sub><code>banner</code> · 1200×630 · the same input at Open Graph size</sub>
    </td>
    <td>
      <img src="docs/samples/card-wide-solid.png" alt="card template, solid background" width="100%" /><br />
      <sub><code>card</code> · 1200×630 · solid background, title only</sub>
    </td>
  </tr>
  <tr>
    <td>
      <img src="docs/samples/code-square.png" alt="code template, square" width="100%" /><br />
      <sub><code>code</code> · 1200×1200 · bash, <code>github-dark</code></sub>
    </td>
    <td>
      <img src="docs/samples/code-wide.png" alt="code template, landscape" width="100%" /><br />
      <sub><code>code</code> · 1200×630 · TypeScript, <code>night-owl</code></sub>
    </td>
  </tr>
</table>

## Upgrading from 1.x

Adding the `code` template made two small breaking changes:

- `Template.render` may now return `string | Promise<string>`, and `buildSvg`
  is `async`. Custom templates that return a string still work unchanged; call
  sites of `buildSvg` need an `await`. `renderMetaImages` and `generate` were
  already async and are unaffected.
- `MetaImageProps.title` is optional, and `walkContent`/`extractProps` no
  longer skip a file that declares props without a title — a `code` post
  describes its image entirely through `code` and `language`.

## Development

- `pnpm build` — compile to `dist/`.
- `pnpm test` / `pnpm test:coverage` — run Vitest.
- `pnpm lint` — ESLint + Prettier check.
- `pnpm fmt` — auto-fix.
- `pnpm samples` — regenerate the README sample images into `docs/samples/`.
- `pnpm fta` — [FTA](https://ftaproject.dev) maintainability scores for `src/`,
  failing on any file that scores 50 or above.
- `pnpm check` — format, FTA, typecheck and test with coverage (run before
  committing).

## License

Apache-2.0
