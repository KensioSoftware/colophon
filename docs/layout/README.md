---
description: Build custom Colophon templates with functions for arranging text and images in SVG.
---

# The layout toolkit

The layout toolkit provides functions for arranging text and images in a
custom SVG template.

The built-in templates use these functions too. Each function takes values
and returns geometry, text lines or SVG. You can combine the helpers with
your own SVG markup.

```ts
import { box, drawLines, inset } from "@kensio/colophon/layout";
```

Import from `@kensio/colophon/layout` to use the toolkit without Node, the
rasteriser or the syntax highlighter. The package root also exports these
functions.

## Rectangles

Use rectangles to describe areas in the image. `inset` reduces a rectangle
by the requested margins:

```ts
const full = { x: 0, y: 0, ...dimensions };
const content = inset(full, Math.round(dimensions.width * 0.08));
const belowHeader = inset(content, { top: 120 });
```

A number applies the same inset to every edge. An object sets individual
edges. If the insets exceed the available space, the resulting dimensions are
clamped to zero.

## Text

First calculate the text lines and their sizes, then position and draw them.

`blockLines` reads a prop and fits it to a width. It can shrink text to fit
and returns the lines with their final font sizes:

```ts
const lines = blockLines(props.title, measure, config.fontFamily, {
  maxWidth: content.width,
  maxLines: 3,
  fontSize: Math.round(height * 0.1),
  floor: 0.62, // may shrink to 62% of fontSize before it is cut instead
  fontWeight: 800,
  opacity: 1,
});
```

Use `measure` from the template context. It measures text with the fonts
loaded for the build. See [Fonts](../configuration/fonts/) for measurement
and fallback behaviour.

`drawLines` positions the lines as a block and returns SVG `<text>` elements:

```ts
drawLines(lines, content, {
  fontFamily: config.fontFamily,
  fill: config.colors.foreground,
  anchor: "middle", // omit to draw from the left edge
});
```

Combine results from several `blockLines` calls to lay out a title and
subtitle together. Set `gapBefore` on the second group to separate them.

For control over the SVG markup, use `placeLines` to calculate baselines
without drawing. For one line, `baselineFor` takes the top of a band one font
size tall and returns its baseline:

```ts
const heading = { x: 0, y: 60, width, height: 54 };
textElement(title, { y: baselineFor(heading.y, 54), fontSize: 54, ...attrs });
```

Use `baselineFor` for text in a fixed-height strip. It reserves space below
the baseline for descenders, such as the bottom of a lowercase `g`.

`measureIn` binds a measurer to one font family and weight:

```ts
const widthOf = measureIn(measure, config.fontFamily, 700);
const chipWidth = widthOf("release", 32) + 48;
```

`linesHeight` calculates a text block's height before drawing. Use it when
placing text alongside other items, such as a logo stacked above a name:

```ts
const [markSlot, textSlot] = stack(
  [{ size: 240 }, { size: linesHeight(lines), gapBefore: 60 }],
  content,
);
```

`fillLines` finds the largest font size that fits all the text inside a box:

```ts
const lines = fillLines(props.title, measure, config.fontFamily, {
  maxWidth: content.width,
  maxHeight: content.height,
  lineHeight: 1.08, // pass the same value to drawLines
  maxFontSize: Math.round(height * 0.5),
  minFontSize: Math.round(height * 0.125),
  fontWeight: 800,
  opacity: 1,
});
```

Use `fillLines` when the text should fill the available space, as in the
`thumbnail` template. Use `blockLines` when headings should keep a preferred
size and shrink only as needed.

`fillLines` wraps onto more lines when that permits larger text. It keeps
words together when fitting them. Use `fillText` for the same behaviour when
you already have a string.

`clampLine` shortens a single line to fit its width and adds an ellipsis.
Use it when the font size must stay fixed, such as in a list whose items all
use the same size:

```ts
clampLine(change, content.width - indent, widthOf, 44);
```

`trackingFor` calculates letter spacing to expand a line to a target width.
Assign the result to `TextLine.letterSpacing`. `trackedWidth` calculates the
final width for positioning:

```ts
const spacing = trackingFor(tagline, widthOf(tagline, 40), nameWidth);
```

Letter spacing is applied between characters. A line of `n` characters has
`n - 1` gaps. `trackingFor` returns `0` if the line already meets or
exceeds the target width, or if it has only one character. The `cover`
template uses it to [align a tagline with a name](../templates/#tracking-the-tagline-to-the-name).

`stringList` reads a prop supplied as a YAML sequence or a single value.
Use it for fields such as `tags` or `breadcrumb`:

```ts
stringList(props["tags"]); // ["typescript", "testing"], or [] for nothing usable
```

## Boxes and panels

`box` draws a rectangle with optional fill, rounded corners and stroke.
Omitted attributes are left out of the SVG.

```ts
box(rect, { radius: 20, fill: "#ffffff", fillOpacity: 0.16 });
```

`panel` draws a box with a shadow:

```ts
panel(rect, { radius: 24, fill: "#0d1117", shadow: 12 });
```

The shadow is a second rectangle offset downwards.

## Images

`image` draws an image inside a rectangle. Supply a `data:` URI to embed its
bytes in the SVG:

```ts
import { readFile } from "node:fs/promises";

const bytes = await readFile("hero.jpg");
image(full, `data:image/jpeg;base64,${bytes.toString("base64")}`);
```

The default `fit` is `cover`, which fills the rectangle and crops overflow.
Use `contain` to show a complete logo. Set `radius` for rounded corners and
provide a unique `id` for the clip path.

## Scrims

A scrim is a translucent colour layer over an image. It improves contrast
between a photograph and text:

```ts
scrim(full, "hero-scrim", { from: 0.1, to: 0.8 });
```

This example darkens the image more at the bottom. Use equal `from` and `to`
values for a uniform overlay. A uniform overlay ignores `id` because it needs
no gradient.

## Rows and stacks

`stack` arranges items vertically, and `row` arranges them horizontally.
Both return one rectangle per item and accept `start`, `centre` or `end`
alignment:

```ts
const chips = row(
  tags.map((tag) => ({ size: widthOf(tag, 32) + 48, gapBefore: 16 })),
  { ...content, height: 64 },
  "start",
);
```

If a group exceeds its available space, it starts at the leading edge and
overflows. Items are not resized. Both helpers use `distribute`, which is
also exported for custom axis layouts.

<a id="ids-have-to-be-unique"></a>

## Unique SVG ids

Give each gradient and clip path a unique id within the SVG. Reusing an id
can make multiple elements reference the same definition. Name ids for their
purpose, and distinguish repeated instances.

## A whole template

```ts
import {
  blockLines,
  drawLines,
  image,
  inset,
  scrim,
  type Template,
} from "@kensio/colophon/layout";

export const photo: Template = {
  name: "photo",
  render({ props, config, dimensions, measure }) {
    const full = { x: 0, y: 0, ...dimensions };
    const content = inset(full, Math.round(dimensions.width * 0.07));

    const lines = blockLines(props.title, measure, config.fontFamily, {
      maxWidth: content.width,
      maxLines: 3,
      fontSize: Math.round(dimensions.height * 0.09),
      floor: 0.6,
      fontWeight: 800,
      opacity: 1,
    });

    return (
      image(full, String(props["photo"])) +
      scrim(full, "photo-scrim", { from: 0.1, to: 0.8 }) +
      drawLines(lines, content, {
        fontFamily: config.fontFamily,
        fill: config.colors.foreground,
        align: "end",
      })
    );
  },
};
```

Register the template under `config.templates`. See
[Templates](../templates/) for registration.
