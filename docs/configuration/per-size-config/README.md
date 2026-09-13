---
description: Override Colophon settings for individual output sizes within one build.
---

# Per-size config

An output size can override the settings used to render it. For example, a
landscape code image may need a smaller minimum font size than a square image.

Add overrides to the size object:

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

Colophon reads the content tree once and applies each size's settings while
rendering that size.

## What can be overridden

A size can override `theme`, `colors`, `background`, `texture`,
`textureScale`, `safeArea`, `fontFamily`, `logo`, `footer`, `badge` and `code`.
Use [`textureScale`](../themes/#textures-at-thumbnail-size) for images shown
at a reduced size and [`safeArea`](../cover-images/) for platform cropping.

The following settings are shared by the whole build:

- Font files and loading (`fonts` and `systemFonts`).
- Custom templates and the rasteriser.
- Encoding settings, including format, compression and quality.
- The `onWarning` callback.

Putting a shared setting in a size object causes an unknown-option error.

An individual size can change `fontFamily` to choose from loaded fonts. It
cannot load a different set of font files.

## Merging and replacing

`colors` and `code` merge with the top-level config. The example above keeps
`github-dark` and changes only `minFontScale`. You can also override a single
colour:

```ts
sizes: [
  SIZE_PRESETS.og,
  { ...SIZE_PRESETS.square, colors: { foreground: "#111827" } },
];
```

This changes only the square image's text colour and preserves the brand
palette.

Colour overrides also preserve colours supplied by a [theme](../themes/).

Other settings replace the entire value. For example, a size's `background`,
`badge` or `safeArea` must describe the complete replacement.

A post's [badge prop](../../templates/) takes priority over a size's badge.

A size's `theme` replaces the top-level theme. Theme values are defaults, so
explicit top-level settings still take priority. Omit those settings if you
want the size's theme to supply them.

## Overrides and rebuilds

Overrides are included in the [rebuild stamp](../../rebuilds/) for that size.
Changing an override regenerates that size's image only.

Colophon resolves the merged config for each size, including derived values.
For example, overriding `colors.brand` also updates a default gradient derived
from that colour.
