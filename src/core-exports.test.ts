/**
 * What the core entry point exports, as against what it costs to import.
 *
 * The cost is `core.test.ts`, which walks the built import graph. These are the
 * exports that graph is there for: the pure half of the content layer and the
 * config check, both of which have to work with no filesystem under them.
 */
import { assertArrayLength, assertIdentical } from "@kensio/smartass";
import { describe, it } from "vitest";

import type { ColophonConfig } from "./types.js";

/**
 * Importing the entry point brings Shiki's grammars with it, which takes longer
 * than the suite's default allows once the other files are running alongside.
 * Importing it is the point of these two, so they are given the time rather
 * than pointed at something smaller.
 */
const importTimeout = 5000;

describe("the core entry point", () => {
  it(
    "reads props out of frontmatter without a filesystem",
    async () => {
      // Something rendering a post it was handed rather than one it went and
      // found still has to understand frontmatter, and `content/index.js`
      // would bring `node:fs` with it.
      const { extractProps } = await import("./core/index.js");

      assertIdentical(
        extractProps({ meta_img_props: { template: "card", title: "Hello" } })
          ?.title,
        "Hello",
      );
    },
    importTimeout,
  );

  it(
    "reports the problems in a config without throwing them",
    async () => {
      // Somewhere with a place to put a list of problems wants the list.
      // `resolveConfig` throws on the first and says nothing about the second.
      const { configProblems } = await import("./core/index.js");

      // The typo is the point, so this is a config TypeScript would refuse.
      const mistyped = {
        colors: { forground: "#fff" },
      } as unknown as ColophonConfig;

      assertArrayLength(configProblems(mistyped), 1);
    },
    importTimeout,
  );
});
