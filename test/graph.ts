/**
 * Walking the built import graph, which is the only way to check what an entry
 * point actually costs to import.
 *
 * Reading `src/` would not do: what a consumer resolves is `dist/`, through the
 * export map and the `browser` field, and it is the `browser` field that makes
 * the core entry point browser-safe at all. This reads the same files a bundler
 * would, and applies the same substitution.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** `package.json`'s `browser` map, as absolute paths. */
function browserSubstitutions(): ReadonlyMap<string, string> {
  const manifest = JSON.parse(
    readFileSync(path.join(root, "package.json"), "utf8"),
  ) as { browser?: Record<string, string> };

  return new Map(
    Object.entries(manifest.browser ?? {}).map(([from, to]) => [
      path.join(root, from),
      path.join(root, to),
    ]),
  );
}

/** Every `from "..."` in a built module, which is all `tsc` emits. */
function specifiersIn(file: string): readonly string[] {
  if (!existsSync(file)) {
    throw new Error(
      `${path.relative(root, file)} is not there. This walks the built` +
        ` package rather than the source, since what a consumer resolves is` +
        ` dist/, so run \`pnpm build\` first. \`pnpm check\` does.`,
    );
  }

  const source = readFileSync(file, "utf8");

  return Array.from(
    source.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g),
    ([, specifier]) => specifier ?? "",
  );
}

export interface Graph {
  /** Every built module reachable from the entry point. */
  readonly modules: readonly string[];
  /** Every bare specifier it reaches, packages and `node:` builtins alike. */
  readonly external: readonly string[];
}

/**
 * Walk what an entry point imports.
 *
 * `isBrowser` applies the `browser` field's substitutions on the way, so the
 * answer is what a bundler targeting a browser or a worker would pull in.
 */
export function importGraph(entry: string, isBrowser = false): Graph {
  const swaps = isBrowser ? browserSubstitutions() : new Map<string, string>();
  const modules = new Set<string>();
  const external = new Set<string>();

  const walk = (file: string): void => {
    const target = swaps.get(file) ?? file;

    if (modules.has(target)) {
      return;
    }

    modules.add(target);

    for (const specifier of specifiersIn(target)) {
      if (!specifier.startsWith(".")) {
        external.add(specifier);
        continue;
      }

      // Followed unconditionally: a relative specifier that resolves to
      // nothing is a broken build, and skipping it quietly would let the
      // purity check pass having looked at less than it thinks.
      walk(path.resolve(path.dirname(target), specifier));
    }
  };

  walk(path.join(root, entry));

  return {
    modules: [...modules].map((file) => path.relative(root, file)),
    external: [...external].toSorted((a, b) => a.localeCompare(b)),
  };
}
