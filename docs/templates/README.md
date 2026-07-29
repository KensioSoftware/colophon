# Templates

A template is a layout. Frontmatter picks one by name, so different posts on the
same site can produce different kinds of image from the same config.

| Name     | Layout                                                                       |
| -------- | ---------------------------------------------------------------------------- |
| `banner` | Left-aligned title with optional version, subtitle, corner badge and footer. |
| `card`   | Minimal centred title with an optional subtitle.                             |
| `code`   | Syntax-highlighted snippet on a rounded panel over the background.           |

The `code` template has enough of its own behaviour to need
[a page of its own](../code-template/).

## Choosing a template

The `template` field inside the props block names it:

```yaml
---
meta_img_props:
  template: card
  title: About
---
```

A post that names no template gets `content.defaultTemplate`, which is unset by
default. Both the field name and the default are configurable under `content`;
see [Frontmatter](../configuration/frontmatter/).

Naming a template that is not registered fails the build and lists the ones that
are, because a name typed into frontmatter is easy to get wrong:

```text
Unknown template "bannner". Available templates: banner, card, code.
```

## Writing your own

Pass `templates` in config. The keys are the names frontmatter uses, and what
you supply is merged over the built-ins, so a key of `banner` replaces the
built-in `banner`.

A template's `render` receives the props, the resolved config and the pixel
dimensions of the image being drawn. It returns the SVG _foreground_ content.
The background and the enclosing `<svg>` root are added by the renderer, so a
template does not draw them.

```ts
import { defineConfig, escapeXml, type Template } from "@kensio/colophon";

const stripe: Template = {
  name: "stripe",
  render({ props, config, dimensions }) {
    const { width, height } = dimensions;

    return `
      <rect x="0" y="${height - 32}" width="${width}" height="32"
            fill="${config.colors.brandWarm}" />
      <text x="80" y="${height / 2}"
            font-family="${config.fontFamily}"
            font-size="${width * 0.08}" font-weight="700"
            fill="${config.colors.foreground}">${escapeXml(props.title ?? "")}</text>
    `;
  },
};

export default defineConfig({
  colors: { brand: "#2563eb" },
  templates: { stripe },
});
```

Some notes on writing one:

- **Size everything from `dimensions`.** The same template is asked to draw a
  1200x1200 square and a 1200x630 landscape. Fractions of the width travel
  better than fixed pixel values, since that is what a feed scales the image to.
- **Escape anything that came from frontmatter.** `escapeXml` is exported for
  this. A title containing `&` produces invalid SVG otherwise.
- **`props` is open.** Colophon does not check what a template reads, so you can
  put whatever fields your layout needs into the props block.
- **`render` may return a promise** if it has to load something. Keep it
  synchronous when it does not need to. The built-in `code` template is async
  because it loads syntax grammars on demand.

`config` here is the resolved config, with defaults applied and per-size
overrides folded in, so `config.colors.brandWarm` is always a colour and
`config.footer` is either a string or `undefined`.
