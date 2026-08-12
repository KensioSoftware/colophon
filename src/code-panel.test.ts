import {
  assertArrayLength,
  assertIdentical,
  assertNonNullable,
  assertStringIncludes,
  assertStringNotIncludes,
  assertTrue,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { renderTemplate as render, wide } from "../test/template.js";
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

    assertArrayLength(fadedTokens(plain), 0);
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
