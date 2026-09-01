import {
  assertArrayEmpty,
  assertArrayLength,
  assertStringIncludes,
  assertStringNotIncludes,
  assertTrue,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { renderTemplate as render, wide } from "../test/template.js";
import { codeTemplate } from "./templates/index.js";
import type { ColophonConfig, MetaImageProps } from "./types.js";

const code = "const a = 1;\nconst b = 2;\nconst c = 3;";

const accent = "#ec4899";

/** The marks a render drew: rectangles in the accent, not the panel's edge. */
function marks(svg: string): readonly string[] {
  return Array.from(
    svg.matchAll(/<rect[^>]*ec4899[^>]*\/>/g),
    ([match]) => match,
  );
}

/** The y a mark was drawn at, for comparing one line's mark against another. */
function markY(svg: string): number {
  return Number(/<rect[^>]* y="(\d+)"[^>]*ec4899/.exec(svg)?.[1] ?? 0);
}

async function renderMarked(
  mark: unknown,
  warnings: string[] = [],
  props: Partial<MetaImageProps> = {},
): Promise<string> {
  const config: ColophonConfig = {
    colors: { brand: "#0f766e", brandWarm: accent },
    onWarning: (message) => {
      warnings.push(message);
    },
  };

  return render(
    codeTemplate,
    { template: "code", language: "typescript", code, mark, ...props },
    config,
    wide,
  );
}

describe("code marks", () => {
  it("boxes the first occurrence of the text it is given", async () => {
    const svg = await renderMarked("const b");
    const [drawn] = marks(svg);

    assertArrayLength(marks(svg), 1);
    // Stroked rather than filled: the box points at the code instead of
    // washing over it.
    assertStringIncludes(drawn ?? "", `stroke="${accent}"`);
    assertStringNotIncludes(drawn ?? "", "fill");
  }, 5000);

  it("marks the second line lower down than the first", async () => {
    const first = await renderMarked("const a");
    const second = await renderMarked("const b");

    assertTrue(markY(second) > markY(first));
  }, 5000);

  it("draws a band across a line named without a column", async () => {
    const svg = await renderMarked({ line: 2 });
    const [drawn] = marks(svg);

    assertArrayLength(marks(svg), 1);
    // Filled rather than stroked: a whole line is highlighted, not pointed at.
    assertStringIncludes(drawn ?? "", `fill="${accent}"`);
    assertStringIncludes(drawn ?? "", 'fill-opacity="0.16"');
  }, 5000);

  it("takes a list, and a colour of the mark's own", async () => {
    const svg = await renderMarked(["const a", { line: 3, color: "#facc15" }]);

    assertArrayLength(marks(svg), 1);
    assertStringIncludes(svg, 'fill="#facc15"');
  }, 5000);

  it("reports text the drawn snippet does not hold", async () => {
    const warnings: string[] = [];
    const svg = await renderMarked("const z", warnings);

    assertArrayEmpty(marks(svg));
    assertArrayLength(warnings, 1);
    assertStringIncludes(
      warnings[0],
      'code mark "const z" not found in the snippet as drawn.',
    );
  }, 5000);

  it("reports a mark that says nothing to mark", async () => {
    const warnings: string[] = [];
    const svg = await renderMarked({ colour: "red" }, warnings);

    assertArrayEmpty(marks(svg));
    assertStringIncludes(warnings[0] ?? "", "says nothing to mark");
  }, 5000);

  it("reports a mark on a line the fitting dropped", async () => {
    const warnings: string[] = [];
    const svg = await renderMarked("const last", warnings, {
      code: `${Array.from(
        { length: 40 },
        (_unused, line) => `const line${String(line)} = ${String(line)};`,
      ).join("\n")}\nconst last = true;`,
    });

    assertArrayEmpty(marks(svg));
    // Two warnings: the snippet did not fit, and the mark went with it.
    assertArrayLength(warnings, 2);
  }, 5000);
});
