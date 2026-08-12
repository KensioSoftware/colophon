# Themes and background treatments

A theme is a named look, made up of a palette, a background and, for some of
them, a texture over it. Naming one is the shortest config a project can write.

```ts
export default defineConfig({
  theme: "midnight",
  footer: "example.com",
});
```

## The set

| Theme       | Look                                                |
| ----------- | --------------------------------------------------- |
| `midnight`  | Deep navy, indigo and violet mesh, faint dot grid   |
| `aurora`    | Near-black teal under teal, cyan and violet         |
| `ember`     | Warm dark, brown into orange                        |
| `forest`    | Deep green, ruled diagonally                        |
| `bloom`     | Violet into pink and magenta                        |
| `slate`     | Flat cool navy with a dot grid                      |
| `paper`     | Warm off-white, ruled, near-black text              |
| `sandstone` | Pale sand gradient with a dot grid, near-black text |

<table>
  <tr>
    <td width="25%"><img src="../../samples/theme-midnight.png" alt="midnight theme" width="100%" /></td>
    <td width="25%"><img src="../../samples/theme-aurora.png" alt="aurora theme" width="100%" /></td>
    <td width="25%"><img src="../../samples/theme-ember.png" alt="ember theme" width="100%" /></td>
    <td width="25%"><img src="../../samples/theme-forest.png" alt="forest theme" width="100%" /></td>
  </tr>
  <tr>
    <td><img src="../../samples/theme-bloom.png" alt="bloom theme" width="100%" /></td>
    <td><img src="../../samples/theme-slate.png" alt="slate theme" width="100%" /></td>
    <td><img src="../../samples/theme-paper.png" alt="paper theme" width="100%" /></td>
    <td><img src="../../samples/theme-sandstone.png" alt="sandstone theme" width="100%" /></td>
  </tr>
</table>

Six are dark, because white text on a deep background is what a share image is
usually asked to be, and two are light for a site whose own pages are.

## What a theme sets

`colors`, `background` and sometimes `texture`, and nothing else. Those are
ordinary config options, so a theme is a set of defaults rather than a fixed
look, and any of the three you name yourself is the one that is used.

```ts
export default defineConfig({
  theme: "midnight",
  // Keeps midnight's mesh and dot grid; the badge and text follow this brand.
  colors: { brand: "#0d9488" },
});
```

The consequence worth knowing is the one in that comment. A theme's background
is written out rather than derived from its palette, so changing `colors`
changes the accent and the text and leaves the picture behind them alone. That
is deliberate: `midnight` without its mesh and `slate` without its dot grid are
the same flat navy image, so a theme that was only a palette would have very
little to it. Set `background` as well when you want the whole thing to follow
your own colours, or use `colors` on its own without a theme, which derives the
usual gradient from your brand.

An unknown theme name stops the build rather than being ignored, along with
[every other unrecognised value](../#unknown-options).

## Textures

The treatments can be used on their own, over any background:

```ts
export default defineConfig({
  colors: { brand: "#2563eb" },
  texture: { type: "dots" },
});
```

A texture is drawn over the background and under everything the template draws,
so it never comes between a headline and the reader. All of them are intended
to be noticed only in passing, and the defaults are faint.

| Texture   | Options                                     |
| --------- | ------------------------------------------- |
| `"grain"` | `opacity`, `scale`                          |
| `"dots"`  | `color`, `opacity`, `size`, `gap`           |
| `"rules"` | `color`, `opacity`, `width`, `gap`, `angle` |
| `"waves"` | `color`, `opacity`, `width`, `gap`          |

Everything but `grain` defaults to the foreground colour, so a texture shows up
on a light theme as readily as on a dark one. Lengths are in pixels at the size
being rendered.

### Waves

`waves` is two sets of concentric rings, one centred on the middle of each side
edge:

```ts
export default defineConfig({
  colors: { brand: "#16a34a" },
  texture: { type: "waves" },
});
```

<img src="../../samples/texture-waves.png" alt="waves texture" width="50%" />

What you see is not the rings but the interference between the two sets, which
reads as curves flowing across the image. Unlike the dot grid and the ruled
lines it is not a tile, so it does not repeat, and its shape follows the
proportions of the image: a landscape gets flatter curves than a square.

`opacity` is the set drawn from the left, and the set from the right is drawn
fainter than that. `gap` is the distance from one ring to the next, and it is
the setting worth playing with, since it decides how tight the curves are.
Above about 40 the two sets stop blurring into each other and the image reads
as what it is, which is a lot of circles.

#### Waves costs bytes as well

Not as many as grain, and for a different reason. There are only a few dozen
circles to draw, but their antialiased edges put a different set of colours in
every row of the image, which is most of what PNG compresses by. Measured on a
1200×1200 card over a gradient:

| Texture           | PNG   |
| ----------------- | ----- |
| none              | 81KB  |
| `dots`            | 100KB |
| `rules`           | 93KB  |
| `waves`           | 624KB |
| `waves`, `gap` 44 | 415KB |
| `grain`           | 1.7MB |

Rendering is around 500ms against 270ms with no texture. If the size matters
more than the format does, [`format: "webp"`](../formats/) takes the same
image to 91KB, since a lossy encoding does not care how many colours a row
holds.

### Grain costs bytes

`grain` is one turbulence filter, and per-pixel noise is the one thing PNG
cannot compress. It takes a 1200×1200 image from around 600KB to a little over
2MB, and adds roughly 150ms to rendering it.

That is well inside what the social platforms accept, but it is a lot to commit
next to a post, which is why no theme turns grain on by itself. Choose it
deliberately, and look at what lands on disk afterwards.

## Meshes

A mesh is soft blobs of colour over a flat base, which gives colour that moves
in more than one direction, unlike a linear gradient. Each blob is a radial
fade, so it costs no more to render than a gradient does.

```ts
export default defineConfig({
  background: {
    type: "mesh",
    color: "#0b1020",
    blobs: [
      { color: "#4338ca", x: 0.12, y: 0.05, radius: 0.55, opacity: 0.85 },
      { color: "#7c3aed", x: 0.9, y: 0.85, radius: 0.5, opacity: 0.7 },
    ],
  },
});
```

Positions are fractions of the image and radii are fractions of its longer
side, so one mesh describes the same picture at every output size. Blobs are
drawn in order, the later ones over the earlier, and each fades to nothing at
its radius. Keep them off the base colour if you want it to show: a blob at
full opacity with a radius near `1` covers everything.

## Per size

A [size](../per-size-config/) can name its own theme and texture, which is how
a square gets a different treatment from a landscape:

```ts
sizes: [
  { name: "og", width: 1200, height: 630 },
  { name: "square", width: 1200, height: 1200, theme: "paper" },
],
```

A size's theme applies the same way the config's does, as defaults under
anything named outright. So a config with its own `texture` keeps it whatever
theme a size asks for.
