# Cover images

A cover is the header image at the top of a profile: the strip behind your name
on X, LinkedIn, Bluesky or a YouTube channel. It is a different problem from a
share card, because the dimensions are only half the specification. Every one of
these platforms crops the image differently on each of its own clients, and
three of the four draw a circular avatar over one corner of it. An image that is
correct at 1500x500 and puts its wordmark bottom-left is still wrong, because
that is where X draws the profile picture.

So Colophon has a `safeArea`: the part of an image that survives being
displayed. There is a preset per platform carrying the right one, and the
[`cover`](../../templates/#cover) template is written for the proportions.

## Making one

A cover is a site asset rather than a post image, so it goes in
[`extra`](../extra-images/):

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

None of the cover presets is in the default sizes, because a cover is made once
for a site and nothing should start rendering one for every post.

## The presets

| Preset              | Upload    | Ratio | Max file | Safe area used                           |
| ------------------- | --------- | ----- | -------- | ---------------------------------------- |
| `xCover`            | 1500x500  | 3:1   | 2MB      | `top/bottom 0.12, left 0.25, right 0.06` |
| `linkedinCover`     | 1584x396  | 4:1   | 8MB      | `top/bottom 0.10, left 0.28, right 0.20` |
| `linkedinPageCover` | 4200x700  | 6:1   | 3MB      | `top/bottom 0.14, left 0.22, right 0.12` |
| `blueskyCover`      | 3000x1000 | 3:1   | 1MB      | `top/bottom 0.15, left 0.22, right 0.10` |
| `youtubeCover`      | 2560x1440 | 16:9  | 6MB      | `top/bottom 0.353, left/right 0.198`     |

LinkedIn is two different assets. `linkedinCover` is the background photo on a
member profile; `linkedinPageCover` is the cover on a company or showcase Page,
which LinkedIn's own help pages now give as 4200x700. Most size guides still
quote 1128x191 for it, which is out of date. Do not reuse one image for both:
4:1 and 6:1 are not close enough.

The file-size limits are not carried on the presets, because how an image is
encoded is not something a size decides. Bluesky's 1MB is the one tight enough
to hit: a 3000x1000 PNG with a texture on it can clear that. Use
[`format`](../formats/) and `maxBytes` if you are near one:

```ts
export default defineConfig({ format: "jpeg", maxBytes: 1_000_000 });
```

## Where the numbers came from

Worth reading before trusting them, because only one of the five is a published
figure and the rest are the best reading available.

**YouTube** is the exact one. The safe area for text and logos is 1546x423,
centred both ways on a 2560x1440 upload, which gives insets of
`(1440 - 423) / 2 / 1440` and `(2560 - 1546) / 2 / 2560`. It checks out against
the figure quoted for the 2048x1152 minimum upload, 1235x338, which is the same
two fractions on a smaller canvas. That is also the argument for holding a safe
area in fractions rather than pixels.

**Bluesky** is the next most solid, because the client is open source and can be
read instead of guessed at. In `src/screens/Profile/Header/Shell.tsx` the banner
is a fixed 150px strip drawn with `cover` fit, and the avatar is a 94px
container at `top: 104, left: 10`. On a 600px web column that means a 3:1 upload
loses 12.5% off the top and bottom, and the avatar covers the left 17% and the
bottom 31% of what is left. On a phone the vertical crop goes away and about
6.7% comes off each side instead. The preset clears both.

**X** publishes neither. Around 60px comes off the top and bottom on some
clients, which is the 0.12. For the avatar, published guides range from a
250x250 corner up to about 370x170 by my own derivation from the web layout, a
133px avatar on a 600px column; `left: 0.25` is 375px and clears both readings.
The right inset keeps clear of the interface buttons.

**LinkedIn** publishes the dimensions but not the safe area. The widely quoted
zone is 1128x376 centred, mobile crops to roughly the centre 60% of the width,
and the avatar takes the bottom-left, at 152x152 on desktop and proportionally
much more on a phone. `right: 0.20` is the mobile crop and `left: 0.28` clears
the avatar, which leaves the content sitting slightly right of centre. That is
what every guide recommends anyway.

If you measure better numbers, override them. That is the whole reason this is
configuration rather than something compiled into a template.

## `safeArea` on its own

The presets are the common cases, but the setting is general and applies to
every template rather than to `cover`. Each edge is an inset from that edge, as
a fraction of the width for `left` and `right` and of the height for `top` and
`bottom`:

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

Everything a template draws is measured against that rectangle instead of
against the image: its margins, its content, its logo and its footer. The
background and any texture still fill the whole image, which is what you want,
since the part a platform crops is still seen on some of its clients.

It is a [per-size override](../per-size-config/) as well as a config setting,
and that is usually where it belongs: a crop is a property of the platform an
image is uploaded to, and a size is what names that. A size's safe area replaces
the config's rather than merging with it, for the reason `background` does. Half
of X's crop over half of YouTube's would be a safe area for nowhere.

### One limitation worth knowing

The safe area moves and constrains everything a template lays out, but a
template still takes its _font sizes_ from the image unless it was written not
to. `cover` was; the other thirteen were not, because changing that would move
the text on every image every existing site has already rendered.

Where that matters is the ratio between the safe area's height and the image's.
`xCover` keeps 76% of its height, `linkedinCover` 80%, `linkedinPageCover` 72%
and `blueskyCover` 70%, and at those any template lays out normally: a `card` at
`xCover` sits inside the safe area correctly. `youtubeCover` keeps 29%, because
the crop is a band across a 16:9 image rather than a trim off a strip, and there
a template sizing from the image overflows its band badly. A `wordmark` at that
size sets its name at 158px in a box 423px tall and collides with its own
footer.

So: use `cover` for covers. The other templates are worth trying at the three
strip presets and are not worth trying at `youtubeCover`.

## Checking one

Covers are `extra` images, so `colophon preview` does not reach them: it renders
one post at one of the sizes in `sizes`. Run the build and open what it wrote:

```bash
npx colophon
```

The stamps mean a second run re-renders nothing, so this is cheap to repeat
while you settle a tagline.

The honest check is still to upload it and look at your own profile on a phone
and on a desktop. The numbers above are a starting point that keeps text out of
the obvious hazards, not a guarantee about a layout somebody else controls.
