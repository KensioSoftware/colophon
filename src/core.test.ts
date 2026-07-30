/**
 * What each entry point costs to import.
 *
 * The core entry point being browser-safe is a property of its import graph and
 * of nothing else, so this is the test that says whether the feature works.
 * A single `import` added to a file three levels down is all it would take to
 * put `node:fs` back, and nothing else in the suite would notice.
 *
 * It reads `dist/`, so `pnpm build` has to have run. `pnpm check` builds before
 * it tests for that reason: `build:check` typechecks and emits nothing, so it
 * is not enough on its own.
 */
import {
  assertArrayEquals,
  assertArrayIncludes,
  assertArrayLength,
  assertArrayNotEmpty,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { importGraph } from "../test/graph.js";

/** Anything that only exists in Node, which is what the core must not reach. */
function nodeOnly(external: readonly string[]): readonly string[] {
  return external.filter(
    (specifier) =>
      specifier.startsWith("node:") ||
      specifier === "@resvg/resvg-js" ||
      specifier === "gray-matter",
  );
}

describe("the core entry point", () => {
  it("reaches nothing that only exists in Node", () => {
    const { external } = importGraph("dist/core/index.js", true);

    assertArrayEquals(nodeOnly(external), []);
  });

  it("still carries what a template actually needs", () => {
    // The point is not an empty graph: text has to be measured and code has to
    // be highlighted, and both of those are libraries that run anywhere.
    const { external, modules } = importGraph("dist/core/index.js", true);

    assertArrayEquals(external, ["fontkit", "shiki"]);
    assertArrayNotEmpty(modules);
  });

  it("is the Node halves when imported from Node", () => {
    // Same entry point, no substitution: a Node caller importing `/core` gets
    // a working rasteriser and real file reading rather than the refusals.
    const { external } = importGraph("dist/core/index.js");

    assertArrayIncludes(external, "@resvg/resvg-js");
  });
});

describe("the meta and layout entry points", () => {
  it("stay free of dependencies altogether", () => {
    // A site's `<head>` should not load a rasteriser, and a template author
    // importing the layout toolkit should not either.
    assertArrayLength(importGraph("dist/meta/index.js").external, 0);
    assertArrayLength(importGraph("dist/layout/index.js").external, 0);
  });
});
