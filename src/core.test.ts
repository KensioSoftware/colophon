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
  assertIdentical,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { importGraph } from "../test/graph.js";
import type { ColophonConfig } from "./types.js";

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

  it("reads props out of frontmatter without a filesystem", async () => {
    // The pure half of the content layer. Something rendering a post it was
    // handed rather than one it went and found still has to understand
    // frontmatter, and `content/index.js` would bring `node:fs` with it.
    const { extractProps } = await import("./core/index.js");

    assertIdentical(
      extractProps({ meta_img_props: { template: "card", title: "Hello" } })
        ?.title,
      "Hello",
    );
  });

  it("reports the problems in a config without throwing them", async () => {
    // Somewhere with a place to put a list of problems wants the list.
    // `resolveConfig` throws on the first and says nothing about the second.
    const { configProblems } = await import("./core/index.js");

    // The typo is the point, so this is a config TypeScript would refuse.
    const mistyped = {
      colors: { forground: "#fff" },
    } as unknown as ColophonConfig;

    assertArrayLength(configProblems(mistyped), 1);
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
