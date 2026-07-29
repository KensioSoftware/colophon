# Configuration

Colophon is configured with a module whose default export is a
`ColophonConfig`. The CLI loads it with `--config`:

```bash
colophon content --config colophon.config.ts
```

Every field is optional, and sensible defaults apply. A project that only wants
its own brand colours can stop after `colors`.

```ts
// colophon.config.ts
import { defineConfig } from "@kensio/colophon";

export default defineConfig({
  colors: { brand: "#2563eb", brandDark: "#1e3a8a", brandWarm: "#f59e0b" },
  footer: "example.com",
  badge: { text: "npm" },
});
```

`defineConfig` is an identity function. It exists for the type checking and
editor completion, so you can drop it if you would rather annotate the export
yourself.

## Options

| Option        | Default                                       | Notes                                                             |
| ------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| `theme`       | none                                          | A named look. See [Themes](./themes/).                            |
| `colors`      | neutral indigo/pink                           | `brand`, `brandDark`, `brandWarm`, `foreground`.                  |
| `background`  | gradient derived from `colors`                | Or a solid colour, a mesh, a gradient or a photo.                 |
| `texture`     | none                                          | Grain, dots or ruled lines. See [Themes](./themes/).              |
| `fonts`       | none                                          | Font files to render with. See [Fonts](./fonts/).                 |
| `systemFonts` | `true` until `fonts` is set                   | Whether installed fonts are loaded too.                           |
| `fontFamily`  | first font, else `Arial, ...`                 | Font stack for template text.                                     |
| `footer`      | none                                          | Footer text. Omit the field for none.                             |
| `badge`       | none                                          | Corner badge for `banner`. Omit the field for none.               |
| `code`        | `github-dark`, monospace stack                | Styling for [the code template](../code-template/).               |
| `onWarning`   | `console.warn`                                | Where compromises are reported. See [Warnings](./warnings/).      |
| `sizes`       | `og` and `square`                             | Named output sizes. See [Output sizes](./sizes/).                 |
| `templates`   | `banner`, `card`, `code`                      | Merged over the built-ins. See [Templates](../templates/).        |
| `content`     | `meta_img_props`, `.md` and `.markdown` files | How props are read. See [Frontmatter](./frontmatter/).            |
| `placement`   | `beside-content`                              | Where images go and their URL. See [Placement](./placement/).     |
| `manifest`    | none                                          | Path to write a JSON manifest to. See [Manifest](./manifest/).    |
| `extra`       | none                                          | Images not tied to a post. See [One-off images](./extra-images/). |

## Computing config at build time

The default export can also be a function returning the config, async or not.

Some configs cannot be written as a literal. Brand colours might be read out of
the site's own stylesheet, a version pulled from `package.json`, or a footer
that names the current build. Without this, such a project has to give up the
CLI and drive `generate` from a script of its own.

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

The function takes no arguments. Everything it might be handed is either already
on the command line or a decision the config itself is making.

It is called once per run, before anything is walked or rendered, and what it
returns is the config, validated and stamped exactly as a literal one would be.
A config whose output changes therefore re-renders like any other edit, and one
that merely reads a file that has not changed does not.

A module that exports neither an object nor a function is an error rather than a
run with the defaults. The command line asked for that file, so quietly
rendering the whole tree without it would be the worst of both. The same check
catches a factory whose arrow body forgot to return.

## Unknown options

The config is closed. An option Colophon does not recognise stops the build
rather than being ignored, because a key nobody reads is otherwise a build that
succeeds and images that are wrong, with nothing in the log to say why.

```text
Unknown option "dimensions". Did you mean "sizes"?
```

Where there is an obvious near miss it is named, including options that have
been renamed between versions. Where there is not, the message lists what is
valid at that point in the config.

An option that has been removed says so, and says what happened instead, since
there is no name to point at:

```text
Option "code.charWidthRatio" has been removed: character width is measured from
the font now. Supply the monospace face under `fonts` to have it measured
exactly.
```

Nested objects are checked too, and named by their path: `code.tabsize`,
`sizes[1].heigth`, `background.stops[0].ofset`. Everything wrong with a config
is reported in one go rather than one run at a time.

Two parts stay open on purpose. The names under `templates` are your own, and a
post's props are read by whichever template understands them.

Validation checks keys rather than the shape of what they hold, so
`colors: "blue"` still gets through to the type checker rather than being caught
here.
