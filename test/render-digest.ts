/**
 * A digest of the rendering code the package ships.
 *
 * `configDigest` puts this in every stamp, where the package version used to
 * go. A release that leaves the drawing alone produces the same digest, and the
 * images already on disk stay where they are.
 *
 * Three kinds of input go in.
 *
 * - Every module reachable from `src/render/index.ts`, by its contents. That
 *   reaches the built-in templates, the modules a template's `render` calls
 *   (which `render.toString()` stops short of), and the shared machinery under
 *   `src/layout`, `src/measure`, `src/render` and `src/encode`.
 * - The font files under `fonts/`. `withBundledFonts` adds those at rasterise
 *   time, once `configDigest` has already run, and they never appear in
 *   `config.fonts` for it to hash.
 * - The installed version of each dependency those modules import. resvg draws
 *   the pixels, sharp encodes them, shiki colours the code templates and
 *   fontkit measures the text, and `config.rasteriser.toString()` sees only the
 *   wrapper around the first of them.
 *
 * A few of the modules it reaches cannot change a pixel, `src/validate` being
 * most of them. Covering them costs an occasional redundant re-render. The
 * alternative is a hand-written list of directories that goes quietly out of
 * date the first time drawing code lands somewhere new, and that costs wrong
 * images.
 *
 * This lives in `test/` because the build and the test suite both run it, and
 * the published package carries `dist` and `fonts` alone. `graph.ts` and
 * `samples.ts` are here on the same terms. It imports only Node's own modules,
 * because `scripts/render-digest.ts` runs it through Node's type stripping,
 * which resolves the specifier it is handed. Every module under `src/` is named
 * with the `.js` extension it takes once compiled, and none of those files
 * exist until `tsc` has run.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Where the walk starts. Every image a build writes is drawn by `buildSvg` and
 * `renderSvgToImage`, and both are exported from here.
 */
const entry = "src/render/index.ts";

/** Sort order for every list that goes into the digest. */
function order(a: string, b: string): number {
  return a.localeCompare(b);
}

/** SHA-256 of a string or buffer, as hex. */
function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

/** The `dependencies` this package declares, in name order. */
function declaredDependencies(): readonly string[] {
  const manifest = JSON.parse(
    readFileSync(path.join(root, "package.json"), "utf8"),
  ) as { dependencies?: Record<string, string> };

  return Object.keys(manifest.dependencies ?? {});
}

/** Every `from "..."` and `import("...")` in a source file. */
function specifiersIn(file: string): readonly string[] {
  const source = readFileSync(path.join(root, file), "utf8");

  return Array.from(
    source.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g),
    ([, specifier]) => specifier ?? "",
  );
}

/**
 * The package a bare specifier comes from. `@shikijs/themes/dracula` is one of
 * dozens of subpaths in a single dependency.
 */
function packageOf(specifier: string): string {
  const parts = specifier.split("/");

  return specifier.startsWith("@")
    ? parts.slice(0, 2).join("/")
    : (parts[0] ?? specifier);
}

export interface RenderInputs {
  /** Every source module a render reaches, as repository-relative paths. */
  readonly modules: readonly string[];
  /** The font files that ship with the package. */
  readonly fonts: readonly string[];
  /** The dependencies those modules import. */
  readonly packages: readonly string[];
}

/**
 * Walk the source from {@link entry} and report what a render reaches.
 *
 * A relative specifier is followed whatever it names, on the same terms as
 * `graph.ts`. One that resolves to nothing is a broken source tree, and
 * stepping over it quietly would digest less than it claims to. A bare one is
 * kept only when the package is declared as a dependency, which throws away the
 * false matches this regex picks out of comments and message strings.
 */
export function renderInputs(): RenderInputs {
  const declared = new Set(declaredDependencies());
  const modules = new Set<string>();
  const packages = new Set<string>();

  const walk = (file: string): void => {
    if (modules.has(file)) {
      return;
    }

    modules.add(file);

    for (const specifier of specifiersIn(file)) {
      if (!specifier.startsWith(".")) {
        const name = packageOf(specifier);

        if (declared.has(name)) {
          packages.add(name);
        }

        continue;
      }

      // `.js` in the source names the file `tsc` will emit, and this reads the
      // one it emits from.
      walk(
        path
          .normalize(path.join(path.dirname(file), specifier))
          .replace(/\.js$/, ".ts"),
      );
    }
  };

  walk(entry);

  const fonts = readdirSync(path.join(root, "fonts"))
    .filter((file) => file.endsWith(".ttf"))
    .map((file) => path.join("fonts", file));

  return {
    modules: [...modules].toSorted(order),
    fonts: fonts.toSorted(order),
    packages: [...packages].toSorted(order),
  };
}

/** The version of a dependency as this build has it installed. */
function installedVersion(name: string): string {
  const manifest = JSON.parse(
    readFileSync(path.join(root, "node_modules", name, "package.json"), "utf8"),
  ) as { version: string };

  return manifest.version;
}

/** The digest of one file's contents. */
function fileDigest(file: string): string {
  return sha256(readFileSync(path.join(root, file)));
}

/**
 * The digest itself. Written into `src/stamp/render-digest.ts` by
 * `scripts/render-digest.ts`, which `pnpm build` runs before it compiles.
 *
 * Every input is named as well as digested, so a module dropping out of the
 * graph moves the answer as surely as its contents changing would.
 */
export function renderDigest(): string {
  const { modules, fonts, packages } = renderInputs();

  return sha256(
    [
      ...modules.map((file) => `module ${file} ${fileDigest(file)}`),
      ...fonts.map((file) => `font ${file} ${fileDigest(file)}`),
      ...packages.map((name) => `package ${name} ${installedVersion(name)}`),
    ].join("\n"),
  );
}
