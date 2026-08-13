# Per-size config

Some settings only make sense per size. `code.minFontScale` is the clearest
case: a 1:1 square and a 1.91:1 landscape have very different amounts of
vertical room, so a snippet that fits one gets truncated in the other.

A size can carry its own overrides, applied only when rendering it:

```ts
import { defineConfig, SIZE_PRESETS } from "@kensio/colophon";

export default defineConfig({
  colors: { brand: "#2563eb" },
  code: { theme: "github-dark" },
  sizes: [
    SIZE_PRESETS.square,
    { ...SIZE_PRESETS.og, code: { minFontScale: 0.013 } },
  ],
});
```

That is one pass over the content tree and one config file. The alternative is
running `generate` once per size with a different config each time, which
re-walks and re-parses everything for every size.

## What can be overridden

Overridable: `theme`, `colors`, `background`, `texture`, `textureScale`,
`fontFamily`, `footer`, `badge` and `code`. These are what a template reads
while drawing, plus `textureScale`, which is where that setting usually belongs:
what it corrects for is how small the image will be looked at, and that is a
property of the size. See [Textures](../themes/#textures-at-thumbnail-size).

Not overridable:

- **`fonts`, `systemFonts` and `templates`**, which are shared build inputs
  rather than part of the picture.
- **`onWarning`**, which is where messages go rather than what they say.

A size naming one of those is an unknown-option error rather than a setting that
quietly does nothing.

`fontFamily` is overridable because it picks from the fonts already loaded.
Supplying different font _files_ per size is not the same thing, and is not
supported.

## Merging and replacing

`colors` and `code` merge over their config-level counterparts, so the example
above keeps `github-dark` and changes only the minimum font size. Any single
shade can be overridden on its own:

```ts
sizes: [
  SIZE_PRESETS.og,
  { ...SIZE_PRESETS.square, colors: { foreground: "#111827" } },
];
```

That keeps the brand palette and changes only the text colour.

That keeps a [theme's](../themes/) palette too, where the config names one and
no colours of its own, so a size asking for whiter text does not drop the rest
of the theme back to the neutral default.

The other options replace rather than merge. A `background` is a union whose
variants have different keys, so merging half of one onto half of another would
produce a background that is neither. A `badge` carries a required `text` that a
partial override could not supply.

A post declaring [its own badge](../../templates/) wins over a size's, since
that one describes the post rather than the shape of the image.

A size's `theme` replaces the config's and then applies as defaults, exactly as
it would at the top level. So a config naming its own `background` keeps it
whatever theme a size asks for, and a size wanting the whole look of one has the
same answer a config does: stop naming the fields the theme should fill in.

## Overrides and rebuilds

An override is part of that image's [rebuild stamp](../../rebuilds/), so
changing one re-renders that size and leaves the others alone.

A size's overrides are folded into the user config and the whole thing is
resolved again, rather than being patched onto an already-resolved config. That
is what keeps derived values consistent: a size overriding `colors.brand` gets
the default gradient rebuilt around its new colour.
