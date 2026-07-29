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

A template's `render` receives the props, the resolved config, the pixel
dimensions of the image being drawn, and a `measure` for its text. It returns
the SVG _foreground_ content. The background and the enclosing `<svg>` root are
added by the renderer, so a template does not draw them.

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

Those primitives are [the layout toolkit](../layout/), which is what the
built-in templates are written on. Returning a string you built yourself works
just as well, and `escapeXml` is exported for when you do.

Some notes on writing one:

- **Size everything from `dimensions`.** The same template is asked to draw a
  1200x1200 square and a 1200x630 landscape. Fractions of the width travel
  better than fixed pixel values, since that is what a feed scales the image to.
- **Escape anything that came from frontmatter.** The toolkit does it for you;
  `escapeXml` is exported for the SVG you write by hand. A title containing `&`
  produces an invalid document otherwise.
- **`props` is open.** Colophon does not check what a template reads, so you can
  put whatever fields your layout needs into the props block.
- **`render` may return a promise** if it has to load something. Keep it
  synchronous when it does not need to. The built-in `code` template is async
  because it loads syntax grammars on demand.
- **Measure text rather than guessing at it.** `measure(text, style)` gives the
  width in pixels that a run of text will occupy, read from the font the build
  is rendering with. Widths are exact where the family resolves to a font
  supplied under [`fonts`](../configuration/fonts/) and estimated otherwise, so
  a template never has to handle the two cases itself. `blockLines` and
  `fitText` do the usual jobs of breaking a title across lines and shrinking one
  that does not fit; see [the layout toolkit](../layout/).

`config` here is the resolved config, with defaults applied and per-size
overrides folded in, so `config.colors.brandWarm` is always a colour and
`config.footer` is either a string or `undefined`.
