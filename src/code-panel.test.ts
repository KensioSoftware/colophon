import {
  assertArrayEmpty,
  assertArrayLength,
  assertIdentical,
  assertNonNullable,
  assertNumberBetween,
  assertStringIncludes,
  assertStringNotIncludes,
  assertTrue,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { renderTemplate as render, square, wide } from "../test/template.js";
import { resolveConfig } from "./config/index.js";
import { createMeasurer } from "./measure/index.js";
import { codeTemplate } from "./templates/index.js";

const snippet = "const a = 1;\nconst b = 2;\nconst c = 3;";

/** Every x a token is drawn at, in the order they appear. */
function columns(svg: string): readonly number[] {
  return Array.from(svg.matchAll(/<tspan x="(\d+)"/g), (match) =>
    Number(match[1]),
  );
}

/** Every token drawn at low opacity, which the line numbers are. */
function numberTokens(svg: string): readonly { text: string; x: number }[] {
  return Array.from(
    svg.matchAll(/<tspan x="(\d+)" [^>]*fill-opacity="0\.4"[^>]*>([^<]*)</g),
    (match) => ({ text: String(match[2]), x: Number(match[1]) }),
  );
}

/** Just their text, for the tests that only care which lines were numbered. */
function fadedTokens(svg: string): readonly string[] {
  return numberTokens(svg).map((token) => token.text);
}

describe("code line numbers", () => {
  it("numbers each line and moves the code across for them", async () => {
    const props = { template: "code", code: snippet, language: "typescript" };
    const plain = await render(codeTemplate, props, {}, wide);
    const numbered = await render(
      codeTemplate,
      props,
      { code: { lineNumbers: true } },
      wide,
    );

    assertArrayEmpty(fadedTokens(plain));
    assertIdentical(fadedTokens(numbered).join(""), "123");
    // The gutter takes its width from the grid, so the code starts further in
    // than it does without one.
    assertTrue((columns(numbered)[1] ?? 0) > (columns(plain)[0] ?? 0));
  }, 5000);

  it("right-aligns the numbers in the digits it reserved", async () => {
    const svg = await render(
      codeTemplate,
      {
        template: "code",
        code: Array.from({ length: 12 }, () => "x();").join("\n"),
        language: "typescript",
      },
      { code: { lineNumbers: true } },
    );

    const numbers = numberTokens(svg);
    const [first, second] = numbers;
    const last = numbers.at(-1);
    assertIdentical(first?.text, "1");
    assertIdentical(second?.text, "2");
    assertIdentical(last?.text, "12");
    // Single digits line up with each other and the two-digit number starts a
    // column earlier, which is what right-aligning in a fixed gutter means.
    assertIdentical(first.x, second.x);
    assertTrue(last.x < first.x);
  }, 5000);

  it("leaves the truncation marker unnumbered", async () => {
    const warnings: string[] = [];
    const svg = await render(
      codeTemplate,
      {
        template: "code",
        code: Array.from(
          { length: 40 },
          (_unused, line) => `const line${String(line)} = ${String(line)};`,
        ).join("\n"),
        language: "typescript",
      },
      {
        code: { lineNumbers: true },
        onWarning: (message) => {
          warnings.push(message);
        },
      },
      wide,
    );

    const drawn = svg.match(/<text /g);
    assertNonNullable(drawn);
    // The marker stands for lines that are not shown, so numbering it would
    // give a line of its own to something that is not a line.
    assertArrayLength(fadedTokens(svg), drawn.length - 1);
    assertTrue(warnings.length > 0);
  }, 5000);
});

describe("code panel chrome", () => {
  const props = {
    template: "code",
    code: snippet,
    language: "typescript",
    filename: "example.ts",
  };

  it("draws no bar and no filename by default", async () => {
    const svg = await render(codeTemplate, props, {}, wide);

    assertStringNotIncludes(svg, "example.ts");
    assertStringNotIncludes(svg, "#ff5f57");
  }, 5000);

  it("draws neutral buttons and the filename under mono", async () => {
    const svg = await render(
      codeTemplate,
      props,
      { code: { chrome: "mono" } },
      wide,
    );

    assertStringIncludes(svg, ">example.ts</text>");
    assertStringNotIncludes(svg, "#ff5f57");
    assertArrayLength(svg.match(/fill="#ffffff" fill-opacity="0\.28"/g), 3);
  }, 5000);

  it("draws the traffic lights under macos", async () => {
    const svg = await render(
      codeTemplate,
      props,
      { code: { chrome: "macos" } },
      wide,
    );

    assertStringIncludes(svg, 'fill="#ff5f57"');
    assertStringIncludes(svg, 'fill="#febc2e"');
    assertStringIncludes(svg, 'fill="#28c840"');
  }, 5000);
});

/** Every line of the title, which is the bold text drawn at 0.95. */
function headingLines(
  svg: string,
): readonly { text: string; fontSize: number; y: number }[] {
  return Array.from(
    svg.matchAll(
      /<text x="\d+" y="(\d+)"[^>]*font-size="(\d+)" font-weight="700"[^>]*fill-opacity="0\.95"[^>]*>([^<]*)</g,
    ),
    (match) => ({
      y: Number(match[1]),
      fontSize: Number(match[2]),
      text: String(match[3]),
    }),
  );
}

/** The top of the panel, which is what the title has to clear. */
function panelTop(svg: string): number {
  const match = /<rect x="\d+" y="(\d+)" width="\d+"[^>]*stroke=/.exec(svg);
  assertNonNullable(match);

  return Number(match[1]);
}

/** The widest line of the title, measured in the face it is drawn in. */
async function widestHeading(svg: string): Promise<number> {
  const config = resolveConfig({});
  const measure = await createMeasurer(config);

  return headingLines(svg).reduce(
    (widest, line) =>
      Math.max(
        widest,
        measure(line.text, {
          fontFamily: config.fontFamily,
          fontSize: line.fontSize,
          fontWeight: 700,
        }),
      ),
    0,
  );
}

describe("code title", () => {
  // 68 characters, which is an ordinary length for a post title and half again
  // what fits on one 54px line across a square.
  const long =
    "Debugging CloudFront Functions deployed via simulated CloudFormation";

  // And one past what fits on a line at either size, since the landscape draws
  // the title at half the square's and so has room for a good deal more of it.
  const longer = `${long} stacks in a local integration test harness`;

  const props = {
    template: "code",
    code: "const x = 1;",
    language: "typescript",
    title: long,
  };

  for (const [name, dimensions] of [
    ["square", square],
    ["landscape", wide],
  ] as const) {
    it(`wraps a long title inside the ${name} image`, async () => {
      const svg = await render(
        codeTemplate,
        { ...props, title: longer },
        {},
        dimensions,
      );
      const lines = headingLines(svg);
      // 5% of the shorter side at each edge, which is what the panel gets too.
      const margin = Math.round(
        Math.min(dimensions.width, dimensions.height) * 0.05,
      );
      const last = lines.at(-1);
      assertNonNullable(last);

      assertArrayLength(lines, 2);
      // Every word still there, none of it past the margin, and the whole
      // block above the panel.
      assertIdentical(lines.map((line) => line.text).join(" "), longer);
      assertTrue((await widestHeading(svg)) <= dimensions.width - margin * 2);
      assertTrue(last.y < panelTop(svg));
    }, 5000);
  }

  it("wraps the title rather than shrinking it away", async () => {
    const svg = await render(codeTemplate, props, {}, square);
    const lines = headingLines(svg);

    // Two lines at close to the size a short title gets, rather than one line
    // at the third of it that would be needed to fit all 68 characters across.
    assertArrayLength(lines, 2);
    assertNumberBetween(lines[0].fontSize, 34, 54);
  }, 5000);

  it("leaves a short title on one line at its full size", async () => {
    const svg = await render(
      codeTemplate,
      { ...props, title: "Listing" },
      {},
      square,
    );

    // 4.5% of the height, undiminished: a title that fits is drawn as it
    // always was, and the images that have one do not move.
    assertArrayLength(headingLines(svg), 1);
    assertIdentical(headingLines(svg)[0]?.fontSize, 54);
  }, 5000);

  it("gives the panel the room the wrapped title took", async () => {
    const one = await render(
      codeTemplate,
      { ...props, title: "Listing" },
      {},
      square,
    );
    const two = await render(codeTemplate, props, {}, square);

    const wrapped = headingLines(two);
    const last = wrapped.at(-1);
    assertNonNullable(last);
    // The second line is drawn below the first and still above the panel, so
    // the block was placed in room that was set aside for it rather than over
    // the plate.
    assertTrue(last.y > (wrapped[0]?.y ?? 0));
    assertTrue(last.y < panelTop(two));
    // And the panel starts lower than it does under a single-line title, which
    // is that room being taken off it.
    assertTrue(panelTop(two) > panelTop(one));
  }, 5000);

  it("shrinks a title too long to wrap into two lines", async () => {
    const svg = await render(
      codeTemplate,
      { ...props, title: longer },
      {},
      square,
    );
    const lines = headingLines(svg);

    // Two lines are all this layout has to give, so the rest comes off the
    // size rather than off the end of the title.
    assertArrayLength(lines, 2);
    assertTrue(lines[0].fontSize < 54);
  }, 5000);
});

describe("code panel surface", () => {
  const props = { template: "code", code: snippet, language: "typescript" };

  it("takes the edge colour and opacity from the config", async () => {
    const svg = await render(
      codeTemplate,
      props,
      { code: { borderColor: "#f43f5e", borderOpacity: 0.5 } },
      wide,
    );

    assertStringIncludes(svg, 'stroke="#f43f5e" stroke-opacity="0.5"');
  }, 5000);

  it("drops the shadow when the panel is translucent", async () => {
    const opaque = await render(codeTemplate, props, {}, wide);
    const glass = await render(
      codeTemplate,
      props,
      { code: { panelOpacity: 0.7 } },
      wide,
    );

    // A shadow seen through the panel casting it reads as a smudge, so the
    // translucent panel is the surface alone.
    assertArrayLength(opaque.match(/<rect/g), 2);
    assertArrayLength(glass.match(/<rect/g), 1);
    assertStringIncludes(glass, 'fill-opacity="0.7"');
  }, 5000);
});
