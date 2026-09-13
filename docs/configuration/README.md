---
description: Configure Colophon social image generation with a JavaScript or TypeScript module.
---

# Configuration

Create a JavaScript or TypeScript module that exports a `ColophonConfig`.
Pass its path to the CLI with `--config`:

```bash
colophon content --config colophon.config.ts
```

All config fields are optional. Set only the values you want to change from
the defaults, such as your brand colours:

```ts
// colophon.config.ts
import { defineConfig } from "@kensio/colophon";

export default defineConfig({
  colors: { brand: "#2563eb", brandDark: "#1e3a8a", brandWarm: "#f59e0b" },
  footer: "example.com",
  badge: { text: "npm" },
});
```

`defineConfig` provides TypeScript checking and editor completion. It returns
the object unchanged. You can also annotate the export with `ColophonConfig`.

## Options

| Option             | Default                                       | Notes                                                               |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------- |
| `theme`            | none                                          | A named look. See [Themes](./themes/).                              |
| `colors`           | neutral indigo/pink                           | `brand`, `brandDark`, `brandWarm`, `foreground`.                    |
| `background`       | gradient derived from `colors`                | Or a solid colour, a mesh, a gradient or a photo.                   |
| `texture`          | none                                          | A treatment over the background. See [Themes](./themes/).           |
| `textureScale`     | `1`                                           | Draw that treatment larger. See [Themes](./themes/).                |
| `safeArea`         | the whole image                               | The part a platform shows. See [Cover images](./cover-images/).     |
| `fonts`            | Outfit and JetBrains Mono                     | Font files to render with. See [Fonts](./fonts/).                   |
| `systemFonts`      | `true` until `fonts` is set                   | Whether installed fonts load behind the bundled ones.               |
| `fontFamily`       | first font, else `Outfit, ...`                | Font stack for template text.                                       |
| `footer`           | none                                          | Footer text. Omit the field for none.                               |
| `badge`            | none                                          | Corner badge for `banner`, which a post may override or turn off.   |
| `code`             | `github-dark`, monospace stack                | Styling for [the code template](../code-template/).                 |
| `onWarning`        | `console.warn`                                | Where compromises are reported. See [Warnings](./warnings/).        |
| `sizes`            | `og` and `square`                             | Named output sizes. See [Output sizes](./sizes/).                   |
| `templates`        | the fourteen built-ins                        | Merged over the built-ins. See [Templates](../templates/).          |
| `rasteriser`       | resvg                                         | What turns SVG into bytes. See [Rasteriser](./rasteriser/).         |
| `compressionLevel` | `9`                                           | How hard to compress the PNG. See [File size](./compression/).      |
| `quantise`         | `false`                                       | Reduce the PNG to a palette. See [File size](./compression/).       |
| `format`           | `png`                                         | Or `jpeg`, `webp`, `avif`. See [Output formats](./formats/).        |
| `quality`          | `80`                                          | For the lossy formats. See [Output formats](./formats/).            |
| `maxBytes`         | none                                          | A ceiling per image. See [Output formats](./formats/).              |
| `emitSvg`          | `false`                                       | Write each image's SVG beside it. See [Output formats](./formats/). |
| `content`          | `meta_img_props`, `.md` and `.markdown` files | How props are read. See [Frontmatter](./frontmatter/).              |
| `placement`        | `beside-content`                              | Where images go and their URL. See [Placement](./placement/).       |
| `manifest`         | none                                          | Path to write a JSON manifest to. See [Manifest](./manifest/).      |
| `extra`            | none                                          | Images not tied to a post. See [One-off images](./extra-images/).   |

## Computing config at build time

The default export can be a function that returns a config object or a promise
of one.

Use a function to load settings from other files or compute values at build
time. For example, this config reads brand colours from a stylesheet:

```ts
// colophon.config.ts
import { readFile } from "node:fs/promises";

import { defineConfig } from "@kensio/colophon";

export default defineConfig(async () => {
  const theme = JSON.parse(await readFile("src/theme.json", "utf8"));

  return {
    colors: { brand: theme.primary, brandDark: theme.primaryDark },
    footer: "example.com",
  };
});
```

The function takes no arguments.

Colophon calls it once per run, before reading content or rendering images.
The returned config is validated and included in rebuild stamps. Images are
rendered again when the resulting settings change.

The module must export an object or a function that returns one. Any other
value causes an error, including a function that returns `undefined`.

## Unknown options

An unrecognised option stops the build and produces an error message:

```text
Unknown option "dimensions". Did you mean "sizes"?
```

For likely misspellings or renamed options, the error suggests a replacement.
Otherwise, it lists the valid options at that location.

Errors for removed options explain how to update the config:

```text
Option "code.charWidthRatio" has been removed: character width is measured from
the font now. Supply the monospace face under `fonts` to have it measured
exactly.
```

Validation includes nested objects and reports each error with its full path,
such as `code.tabsize` or `sizes[1].heigth`. All errors are reported together.

Custom template names under `templates` are allowed. Each template defines
which post props it accepts.

Runtime validation checks option names but does not check every value's type.
For example, use TypeScript to catch an invalid value such as `colors: "blue"`.
