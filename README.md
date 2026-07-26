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

`sharp` is a dependency and does the SVG → PNG rasterisation; `shiki` provides
the grammars and themes for the `code` template.

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
(`post/index.md` → `post/post-og.png` and `post/post-square.png`). Existing
files are skipped unless you pass `--overwrite`.

```
colophon [contentDir] [options]

  -c, --config <path>   Config module whose default export is a ColophonConfig
  -o, --overwrite       Re-render even if the output file already exists
  -h, --help            Show help

  contentDir            defaults to "content"
```

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
  onResult: (result) =>
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

| Prop       | Notes                                                                |
| ---------- | -------------------------------------------------------------------- |
| `code`     | The snippet. Surrounding blank lines are trimmed; tabs are expanded. |
| `language` | Any [Shiki language]; unknown names fall back to plain text.         |
| `title`    | Optional heading above the panel. Omit for a bare code image.        |
| `theme`    | Optional per-post override of `config.code.theme`.                   |

[Shiki language]: https://shiki.style/languages

Pygments-style names carried over from an older pipeline (`text`, `console`,
`html+handlebars`, …) are mapped onto their Shiki equivalents, so existing
frontmatter usually needs no changes.

The font size is fitted to the snippet: Colophon measures the longest line and
the line count against a monospace grid and picks the largest size that fits on
both axes, within `minFontScale`/`maxFontScale`. Code too long to fit legibly is
truncated with an ellipsis rather than shrunk into unreadability. The panel then
shrinks vertically onto the result so short snippets aren't left floating.

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
    maxFontScale: 0.075,
    minFontScale: 0.018,
  },
});
```

`charWidthRatio` is how the layout knows where each token sits, so it must match
the font actually used — `0.6` suits most monospace faces (Source Code Pro,
Menlo, DejaVu Sans Mono); Consolas wants about `0.55`. Fonts must be installed
where `sharp` can see them; the default stack ends in the generic `monospace`
family so it always resolves to something.

## Configuration

All fields are optional; sensible defaults apply.

| Option       | Default                        | Notes                                               |
| ------------ | ------------------------------ | --------------------------------------------------- |
| `colors`     | neutral indigo/pink            | `brand`, `brandDark`, `brandWarm`, `foreground`.    |
| `background` | gradient derived from `colors` | Or a `{ type: "solid" }` / custom gradient.         |
| `fontFamily` | `Arial, Helvetica, sans-serif` | Uses fonts available to `sharp`/librsvg.            |
| `footer`     | none                           | Footer text; omit the field for none.               |
| `badge`      | none                           | Corner badge for `banner`; omit the field for none. |
| `code`       | `github-dark`, monospace stack | Styling for the `code` template (see above).        |
| `sizes`      | `og` + `square`                | Named output sizes (see below).                     |
| `templates`  | `banner`, `card`, `code`       | Merged over the built-ins.                          |

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

### Frontmatter shape

By default Colophon reads a `meta_img_props` object and a `template` field
within it, plus a top-level `slug`. All are configurable via walk options
(`propsKey`, `templateField`, `defaultTemplate`, `slugField`, `extensions`) so
you can match an existing convention.

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
- `pnpm check` — format, typecheck and test with coverage (run before committing).

## License

Apache-2.0
