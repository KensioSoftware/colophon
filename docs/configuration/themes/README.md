# Themes and background treatments

A theme is a named look: a palette, a background and, for some of them, a
texture over it. It is the shortest config there is.

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

## What a theme actually sets

`colors`, `background` and sometimes `texture`, and nothing else. They are
ordinary config options, so a theme is a set of defaults rather than a look
that cannot be argued with: name any of those three yourself and yours is used.

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
so it never comes between a headline and the reader. All three are meant to be
felt rather than seen, and the defaults are faint.

| Texture   | Options                                     |
| --------- | ------------------------------------------- |
| `"grain"` | `opacity`, `scale`                          |
| `"dots"`  | `color`, `opacity`, `size`, `gap`           |
| `"rules"` | `color`, `opacity`, `width`, `gap`, `angle` |

`dots` and `rules` default to the foreground colour, so they show up on a light
theme as readily as on a dark one. Their lengths are in pixels at the size
being rendered.

### Grain costs bytes

`grain` is one turbulence filter, and it looks the part, but per-pixel noise is
the one thing PNG cannot compress. It takes a 1200×1200 image from around 600KB
to a little over 2MB, and adds roughly 150ms to rendering it.

That is well inside what the social platforms accept, and it is a lot to commit
next to a post. It is why no theme turns grain on for you: it is worth choosing
on purpose, and worth a look at what lands on disk afterwards.

## Meshes

A mesh is soft blobs of colour over a flat base, which is the look a linear
gradient cannot give: colour that moves in more than one direction. Each blob
is a radial fade, so it costs no more than a gradient does.

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
