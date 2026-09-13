---
description: Generate profile cover images with Colophon presets that account for cropping and avatar placement.
---

# Cover images

A cover is the header image on a social profile or channel. Platforms may
crop it or place an avatar over it. Keep text and logos inside a safe area
that avoids those regions.

Colophon provides cover-size presets with `safeArea` insets. Use them with
the [`cover`](../../templates/#cover) template.

## Making one

Declare profile covers under [`extra`](../extra-images/) to generate them
once per site:

```ts
import { defineConfig, SIZE_PRESETS } from "@kensio/colophon";

const props = {
  template: "cover",
  title: "Kensio Software",
  subtitle: "Tools for people who publish on the web",
};

export default defineConfig({
  logo: { path: "assets/mark.svg" },
  footer: "kensiosoftware.co.uk",
  extra: [
    { props, output: "public/covers/x.png", size: SIZE_PRESETS.xCover },
    {
      props,
      output: "public/covers/linkedin.png",
      size: SIZE_PRESETS.linkedinCover,
    },
    {
      props,
      output: "public/covers/bluesky.png",
      size: SIZE_PRESETS.blueskyCover,
    },
    {
      props,
      output: "public/covers/youtube.png",
      size: SIZE_PRESETS.youtubeCover,
    },
  ],
});
```

Cover presets are excluded from the default sizes used for each post.

## The presets

| Preset              | Upload    | Ratio | Max file | Safe area used                           |
| ------------------- | --------- | ----- | -------- | ---------------------------------------- |
| `xCover`            | 1500x500  | 3:1   | 2MB      | `top/bottom 0.12, left 0.25, right 0.06` |
| `linkedinCover`     | 1584x396  | 4:1   | 8MB      | `top/bottom 0.10, left 0.28, right 0.20` |
| `linkedinPageCover` | 4200x700  | 6:1   | 3MB      | `top/bottom 0.14, left 0.22, right 0.12` |
| `blueskyCover`      | 3000x1000 | 3:1   | 1MB      | `top/bottom 0.15, left 0.22, right 0.10` |
| `youtubeCover`      | 2560x1440 | 16:9  | 6MB      | `top/bottom 0.353, left/right 0.198`     |

Use `linkedinCover` for member profiles and `linkedinPageCover` for company
or showcase Pages. Their dimensions and aspect ratios differ.

Presets set dimensions and safe areas, but do not enforce file-size limits.
A textured 3000x1000 PNG can exceed the listed Bluesky limit. Use
[`format` and `maxBytes`](../formats/) to control encoding and report oversized
files:

```ts
export default defineConfig({ format: "jpeg", maxBytes: 1_000_000 });
```

## Where the numbers came from

YouTube's safe area uses a published figure. The other presets use estimates
from platform layouts. Treat these as starting points and check the result
on your target devices.

The YouTube preset centres a 1546x423 area within a 2560x1440 image. Its
vertical inset is `(1440 - 423) / 2 / 1440`, and its horizontal inset is
`(2560 - 1546) / 2 / 2560`. These fractions give approximately 1235x338 on a
2048x1152 image.

The Bluesky estimate came from `src/screens/Profile/Header/Shell.tsx`. The
inspected layout used a 150px banner with `cover` fit and a 94px avatar at
`top: 104, left: 10`. On a 600px web column, a 3:1 image loses 12.5% at its
top and bottom. The avatar covers about 17% of the remaining width and 31%
of the remaining height. The mobile estimate loses about 6.7% on each side.
The preset leaves space for both layouts.

The X preset allows 60px of vertical crop at each edge (`0.12` of 500px).
Its left inset of `0.25` reserves 375px for an avatar. This covers the
250x250 to roughly 370x170 overlap estimates used when creating the preset.
The right inset reserves space for interface buttons.

The LinkedIn member-profile estimate combines a centred 1128x376 area,
mobile cropping to about 60% of the width and an avatar at the bottom-left.
The left inset of `0.28` reserves avatar space, and the right inset of `0.20`
allows for mobile cropping.

Override a preset's `safeArea` if your platform layout needs different insets.

## `safeArea` on its own

`safeArea` applies to every template. Each edge is a fraction of the image
dimension. `left` and `right` use width, while `top` and `bottom` use height:

```ts
export default defineConfig({
  sizes: [
    {
      name: "hero",
      width: 2000,
      height: 600,
      safeArea: { top: 0.1, bottom: 0.1, left: 0.3, right: 0.05 },
    },
  ],
});
```

Templates position content, logos and footers inside the resulting rectangle.
The background and texture still fill the entire image.

Set `safeArea` at the top level or on an [output size](../per-size-config/).
A size's safe area replaces the entire top-level value.

<a id="one-limitation-worth-knowing"></a>

### Font sizing

The `cover` template sizes text from the safe area's dimensions. Other
templates constrain their layout to the safe area but calculate font sizes
from the full image.

This distinction matters for `youtubeCover`, whose safe area is only about
29% of the image height. Other templates can produce text too large for that
423px strip. The other cover presets retain 70% to 80% of the image height
and are less likely to overflow.

Use `cover` for profile covers, especially at `youtubeCover` dimensions.
Inspect the output if you choose another template.

## Checking one

`colophon preview` renders posts and cannot select an `extra` image. Run the
build and open the generated cover:

```bash
npx colophon
```

Rebuild stamps skip unchanged images on later runs.

Upload the result and inspect your profile on desktop and mobile. A preset
cannot guarantee how every client will crop or overlay the image.
