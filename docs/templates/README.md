---
description: Built-in Colophon image templates and how to write a custom SVG template.
---

# Templates

A template defines an image's layout. Select a template in each post's
frontmatter to use different layouts with the same site config.

| Name        | Layout                                                                       | Props it reads beyond `title` and `subtitle` |
| ----------- | ---------------------------------------------------------------------------- | -------------------------------------------- |
| `banner`    | Left-aligned title with optional version, subtitle, corner badge and footer. | `version`, `badge`                           |
| `card`      | Minimal centred title with an optional subtitle.                             |                                              |
| `code`      | Syntax-highlighted snippet on a rounded panel over the background.           | `code`, `language`, `theme`                  |
| `article`   | Tags, headline and standfirst, with a byline along the bottom.               | `tags`, `author`, `date`, `avatar`           |
| `quote`     | A pull quote with the speaker under it.                                      | `quote`, `author`, `role`, `avatar`          |
| `terminal`  | A command and its output, in window chrome.                                  | `command`, `output`, `prompt`, `title`       |
| `release`   | A version, what it is, and the headline changes as a list.                   | `version`, `changes`                         |
| `stat`      | One big figure with a label above and a caption below.                       | `stat`                                       |
| `photo`     | The post's photograph, scrimmed, with the title over the bottom of it.       | `image`                                      |
| `wordmark`  | The configured logo above a name and tagline.                                |                                              |
| `docs`      | A breadcrumb trail, a rule, then the page's title.                           | `breadcrumb`                                 |
| `event`     | A date on a plate, then what the event is and where.                         | `date`, `location`                           |
| `thumbnail` | One title grown to fill the frame, for a video thumbnail.                    |                                              |
| `cover`     | A mark beside a name and tagline, for a profile header.                      |                                              |

The [`code` template](../code-template/) has a separate guide. The remaining
templates are described [below](#the-templates-one-by-one).

All templates draw the configured footer. Most also draw a logo. `wordmark`
centres the logo, while `code`, `terminal` and `quote` omit it. See
[Logos, avatars and photographs](../configuration/images/) for placement.

Optional content is omitted when its props are missing. The layout uses the
remaining space.

## Choosing a template

Set `template` inside the image props block:

```yaml
---
meta_img_props:
  template: card
  title: About
---
```

If the post omits `template`, Colophon uses `content.defaultTemplate`, which
is unset by default. You can configure both the field name and the default.
See [Frontmatter](../configuration/frontmatter/).

An unregistered template name stops the build and lists the available names:

```text
Unknown template "bannner". Available templates: article, banner, card,
code, cover, docs, event, photo, quote, release, stat, terminal, thumbnail,
wordmark.
```

## The badge on a banner

A config-level `badge` appears on every `banner` image. Override it for a
post with the `badge` prop:

```yaml
---
meta_img_props:
  template: banner
  title: Keep test state inside each test case
  badge: false
---
```

Set `badge: false` to remove the badge and its reserved space. Supply an
object to replace the configured badge:

```yaml
---
meta_img_props:
  template: banner
  title: Simulating S3 in a test suite
  badge:
    text: video
    background: "#111827"
    color: "#f9fafb"
---
```

Only `text` is required. Colours default to white on the brand colour. A
post's badge takes priority over both the top-level and
[per-size](../configuration/per-size-config/) config.

An invalid badge prop produces a [warning](../configuration/warnings/) and
uses the configured badge.

## The templates one by one

### `article`

A blog card with tags at the top, a title and subtitle in the middle, and an
author and date below.

```yaml
---
meta_img_props:
  template: article
  title: Keep test state inside each test case
  subtitle: Shared fixtures save a few lines and cost you the ability to read one test on its own
  tags: [typescript, testing]
  author: Hugh Grigg
  date: 30 July 2026
  avatar: ./authors/hugh.png
---
```

`tags` accepts a list or a single value. Tags that cannot fit in one row are
omitted. The avatar appears beside the author, with the footer at the other
end of the row. When space is limited, the date is removed before the author's
name is shortened.

Dates are displayed as supplied. Format them in your content or props mapper.

### `quote`

A quotation with a large accent-coloured quotation mark and the speaker below.

```yaml
---
meta_img_props:
  template: quote
  quote: A template is a layout, and a layout is arithmetic you can look at.
  author: Hugh Grigg
  role: Kensio Software
---
```

The template uses `title` if `quote` is omitted. It draws no logo.

### `terminal`

A shell command and its output inside a terminal window.

```yaml
---
meta_img_props:
  template: terminal
  title: colophon
  command: colophon build content --force
  output: |
    rendered 14 images from 7 posts
    done in 1.9s
---
```

`prompt` defaults to `$`. The title appears in the window bar. Commands use
shell syntax highlighting, and output is displayed as plain text.

Each nonempty line in `command` gets its own prompt. Blank lines are kept
without prompts.

The terminal uses the [code template's](../code-template/) font, sizing and
syntax theme settings. Sessions that cannot fit are truncated with an
ellipsis and reported through [warnings](../configuration/warnings/).

### `release`

A release card with a version heading, release title and list of changes.

```yaml
---
meta_img_props:
  template: release
  version: 2.5.0
  title: Templates, themes and a browser-safe core
  changes:
    - Nine more templates
    - A manifest of every image a build wrote
---
```

The version is prefixed with `v` if needed. Both `2.5.0` and `v2.5.0` display
as `v2.5.0`. Up to four changes are shown. Each occupies one line and is
shortened with an ellipsis if needed.

### `stat`

One figure with a label above and a caption below.

```yaml
---
meta_img_props:
  template: stat
  title: Downloads this month
  stat: 1.4M
  subtitle: Up from 900k in June
---
```

The figure stays on one line and shrinks to fit, including longer values
such as `1.4 million downloads`.

### `photo`

A post photograph with the title over its lower edge.

```yaml
---
meta_img_props:
  template: photo
  title: A morning on the Mendips
  subtitle: Twelve miles, one flask of tea
  image: ./posts/mendips/hero.jpg
---
```

Supply `image` as a file path or `data:` URI, using the same loading rules
as [`avatar`](../configuration/images/). If `image` is omitted, the template
uses the configured background.

The template always overlays a dark scrim to improve text contrast. This is
stronger than the default scrim on a
[configured background image](../configuration/images/).

### `wordmark`

A centred logo above a name and tagline, for a home page or repository preview.

```yaml
---
meta_img_props:
  template: wordmark
  title: "@kensio/colophon"
  subtitle: Social meta images from frontmatter
---
```

The logo is part of the centred group. The name stays on one line, shrinking
to fit and then truncating if needed.

### `docs`

A documentation card with a breadcrumb trail above the page title.

```yaml
---
meta_img_props:
  template: docs
  breadcrumb: [Docs, Configuration, Fonts]
  title: Fonts
  subtitle: Load font files so a build renders the same image everywhere
---
```

Use `breadcrumb` to identify the project and section. It accepts a list or
single string. If the trail is too wide, leading segments are replaced with
an ellipsis, preserving the segments nearest to the page.

### `event`

An image for a talk, a meetup or a workshop.

```yaml
---
meta_img_props:
  template: event
  date: 14 November 2026
  title: Rendering text without a browser
  location: Bristol JS, The Old Fire Station
---
```

The date appears on an accent-coloured panel. It is displayed exactly as
supplied.

### `thumbnail`

A video thumbnail with a title that grows to fill the available space.

```yaml
---
meta_img_props:
  template: thumbnail
  title: Rendering text without a browser
  subtitle: Episode 4
---
```

<img src="../samples/thumbnail-video.png" alt="thumbnail template" width="70%" />

Use `SIZE_PRESETS.thumbnail` for a 1280x720 image:

```ts
import { defineConfig, SIZE_PRESETS } from "@kensio/colophon";

export default defineConfig({
  sizes: [SIZE_PRESETS.og, SIZE_PRESETS.thumbnail],
});
```

This template is intended for images displayed much smaller than their
output resolution, such as a video list or sidebar.

The title grows to fill its area. A short title can therefore use larger
text than a long one.

An optional `subtitle` appears below the title and reduces the space
available to it. Use it for a series name or episode number.

The template uses narrow margins and still draws the configured logo and
footer. Set `footer: ""` on the size to remove the footer.

The title wraps when additional lines allow a larger font. If it cannot fit
even at the minimum size (about a tenth of the image height), it is truncated
to the available lines.

For textures that stay visible at reduced display sizes, see
[`textureScale`](../configuration/themes/#textures-at-thumbnail-size).

### `cover`

A profile cover with the logo beside a name and a tagline underneath.

```yaml
---
meta_img_props:
  template: cover
  title: Kensio Software
  subtitle: Tools for people who publish on the web
---
```

<img src="../samples/cover-x.png" alt="cover template" width="70%" />

Declare a cover under [`extra`](../configuration/extra-images/) to generate
it once per site:

```ts
import { defineConfig, SIZE_PRESETS } from "@kensio/colophon";

export default defineConfig({
  extra: [
    {
      props: {
        template: "cover",
        title: "Kensio Software",
        subtitle: "Tools for people who publish on the web",
      },
      output: "public/covers/x.png",
      size: SIZE_PRESETS.xCover,
    },
  ],
});
```

[Cover image presets](../configuration/cover-images/) include dimensions
and safe-area insets for platform crops and avatars.

The logo and text are centred together in a horizontal group. Without a
logo, the text is centred on its own.

The name stays on one line. It shrinks to fit and uses an ellipsis if still
too long. The tagline can wrap onto two lines.

#### Tracking the tagline to the name

Set `tracking: fill` to increase the tagline's letter spacing until it
matches the width of the name:

```yaml
---
meta_img_props:
  template: cover
  title: Kensio Software
  subtitle: kensiosoftware.co.uk
  tracking: fill
---
```

This can align a site URL or short tagline with the name above it.

Tracking is disabled by default. Even with `fill`, the tagline is left
unchanged if it is already at least as wide as the name, wraps onto two lines,
or would need more than half an em of extra space between characters.

For custom templates, use `trackingFor` and `trackedWidth` from
[`@kensio/colophon/layout`](../layout/). Store the calculated spacing in
`TextLine.letterSpacing`.

The cover template sizes its text from the safe area. This is especially
useful for YouTube, where the visible text area is 423px high within a
1440px-high image.

## Writing your own

Register custom templates under `config.templates`. Each key is a name that
frontmatter can select. Reusing a built-in name, such as `banner`, replaces
that built-in template.

A template's `render` function receives image props, resolved config and
pixel dimensions. Its context also provides a text measurer and loaded image
assets. Return SVG foreground markup. The renderer adds the background and
outer `<svg>` element.

```ts
import { defineConfig, type Template } from "@kensio/colophon";
import { box, drawLines, blockLines, inset } from "@kensio/colophon/layout";

const stripe: Template = {
  name: "stripe",
  render({ props, config, dimensions, measure }) {
    const full = { x: 0, y: 0, ...dimensions };
    const content = inset(full, Math.round(dimensions.width * 0.07));

    const lines = blockLines(props.title, measure, config.fontFamily, {
      maxWidth: content.width,
      maxLines: 2,
      fontSize: Math.round(dimensions.height * 0.1),
      floor: 0.65,
      fontWeight: 700,
      opacity: 1,
    });

    return (
      box(
        {
          x: 0,
          y: dimensions.height - 32,
          width: dimensions.width,
          height: 32,
        },
        { fill: config.colors.brandWarm },
      ) +
      drawLines(lines, content, {
        fontFamily: config.fontFamily,
        fill: config.colors.foreground,
      })
    );
  },
};

export default defineConfig({
  colors: { brand: "#2563eb" },
  templates: { stripe },
});
```

The example uses [layout toolkit](../layout/) helpers. You can also return
your own SVG string and use `escapeXml` to escape text.

When writing a template:

- Scale geometry from `dimensions` so the layout works at each output size.
- Escape frontmatter text with toolkit functions or `escapeXml`. Characters
  such as `&` must be escaped in SVG.
- Define the props your template needs. Colophon passes custom fields through.
- Use loaded `logo`, `avatar` and `picture` assets from the context. Each
  provides `href` and `aspect`, or is `undefined`. See
  [Logos and photographs](../configuration/images/).
- Return a promise if rendering needs asynchronous work. Synchronous
  templates can return a string.
- Use `measure(text, style)` for text width. It reads loaded font metrics and
  estimates characters without a matching font. Use `blockLines` or `fitText`
  for wrapping and fitting. See [Fonts](../configuration/fonts/) and
  [the layout toolkit](../layout/).

The context's `config` includes defaults and per-size overrides. For example,
`config.colors.brandWarm` is always a colour, and `config.footer` is a string
or `undefined`.
