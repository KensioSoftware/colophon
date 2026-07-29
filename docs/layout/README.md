# The layout toolkit

Writing a template means returning a string of SVG. That is fine for a heading
and a rectangle, and it stops being fine at about the point you want a photo
behind the text with a gradient over it and a row of chips along the top.

The toolkit is the set of small functions the built-in templates are made from.
Nothing in it holds state: each function takes values and returns them, whether
that is a rectangle, a list of lines or a string of SVG. A template that would
rather write its own SVG by hand still can.

```ts
import { box, drawLines, inset } from "@kensio/colophon/layout";
```

The subpath loads no rasteriser, no syntax highlighter and nothing from Node, so
a template built on it is a plain function over strings. Everything is exported
from the root entry point too, if you are importing `defineConfig` anyway and
would rather have one import.

## Rectangles

Every primitive takes a rectangle, and the one a template starts with is the
image itself. `inset` is how you get from there to somewhere sensible:

```ts
const full = { x: 0, y: 0, ...dimensions };
const content = inset(full, Math.round(dimensions.width * 0.08));
const belowHeader = inset(content, { top: 120 });
```

One number brings every edge in. An object brings in the edges it names. An
inset bigger than the rectangle collapses it rather than turning it inside out.

## Text

Text goes in two steps, because the two questions are separate: how many lines
does this become, and where do they go.

`blockLines` answers the first. It reads a prop, fits it to a width, shrinks it
if it does not fit, and gives back the lines with the size they ended up at:

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

`measure` comes in on the template context rather than from this module, because
only the build knows which fonts it loaded. See
[Fonts](../configuration/fonts/) for what it can and cannot measure exactly.

`drawLines` answers the second, placing the lines as one block and writing the
`<text>` elements:

```ts
drawLines(lines, content, {
  fontFamily: config.fontFamily,
  fill: config.colors.foreground,
  anchor: "middle", // omit to draw from the left edge
});
```

Concatenate the lines from several calls to lay out a title and a subtitle
together, giving the second group a `gapBefore` to separate them. That is all
the `banner` template does.

For finer control there is `placeLines`, which returns the baselines and leaves
the drawing to you, and `baselineFor`, which is the single-line case: give it
the top of a band one font size tall and it returns the baseline to draw at.

```ts
const heading = { x: 0, y: 60, width, height: 54 };
textElement(title, { y: baselineFor(heading.y, 54), fontSize: 54, ...attrs });
```

Reach for it wherever a template has reserved a strip for one line, since
picking the baseline by eye is how the clear space around a line stops matching
the space that was set aside for it. The descender takes what is left of the
band below the baseline, so the room under a line is not the room above it.

There is also `measureIn`, which binds a measurer to one family and weight so
you can ask how wide something is:

```ts
const widthOf = measureIn(measure, config.fontFamily, 700);
const chipWidth = widthOf("release", 32) + 48;
```

## Boxes and panels

`box` is a rectangle with a fill, corners and a stroke. Attributes you do not
name are left out.

```ts
box(rect, { radius: 20, fill: "#ffffff", fillOpacity: 0.16 });
```

`panel` is a box that casts a shadow, which is what makes something read as
sitting on top of the image rather than being part of it:

```ts
panel(rect, { radius: 24, fill: "#0d1117", shadow: 12 });
```

The shadow is a second rectangle offset downwards rather than a blur filter. It
costs the rasteriser nothing and reads as depth just as well at these sizes.

## Images

`image` draws a raster image within a rectangle. Pass a `data:` URI: an image
read at build time and inlined renders the same wherever the build runs, with
nothing to fetch.

```ts
import { readFile } from "node:fs/promises";

const bytes = await readFile("hero.jpg");
image(full, `data:image/jpeg;base64,${bytes.toString("base64")}`);
```

`fit` defaults to `cover`, which fills the rectangle and crops the overflow.
Pass `contain` for a logo, since cropping a wordmark ruins it. `radius` rounds
the corners and needs an `id` to hang its clip path on.

## Scrims

A scrim is a wash of colour over an image so the text on top of it can be read.
Photographs have light and dark in them wherever they like, and white text over
a bright sky is invisible.

```ts
scrim(full, "hero-scrim", { from: 0.1, to: 0.8 });
```

That shades from nearly clear at the top to mostly dark at the bottom, which
suits a headline sitting low. Pass the same value for `from` and `to` for a flat
wash, which needs no gradient and so ignores the id.

## Rows and stacks

`stack` places items down an area and `row` places them across one. Both return
a rectangle per item, and both take an alignment of `start`, `centre` or `end`.

```ts
const chips = row(
  tags.map((tag) => ({ size: widthOf(tag, 32) + 48, gapBefore: 16 })),
  { ...content, height: 64 },
  "start",
);
```

A group larger than the space it was given starts at the edge and runs over
rather than being squeezed, so a template that has overflowed can see that it
has. Both are the same function underneath, `distribute`, which is exported for
laying something out along an axis that is neither.

## Ids have to be unique

Gradients and clip paths are referenced by id, and an image is one SVG document,
so two scrims sharing an id means the second one wins in both places. Name them
after what they are for rather than after the primitive, and add the size name
if a template draws several.

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

Register it under `config.templates` as [Templates](../templates/) describes.
