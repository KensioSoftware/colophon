import {
  assertArrayEquals,
  assertArrayLength,
  assertIdentical,
  assertNumberBetween,
  assertStringIncludes,
  assertStringNotIncludes,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import {
  breakWord,
  escapeXml,
  fitText,
  layoutStack,
  textElement,
  wrapText,
} from "./text/index.js";

function baselineGap(placed: { y: number }[]): number {
  return (placed[1]?.y ?? 0) - (placed[0]?.y ?? 0);
}

/** A measurer for a face where every character is ten units wide. */
function byCharacter(text: string): number {
  return text.length * 10;
}

/** The same, but at whatever size it is asked for: one unit per character. */
function byCharacterAt(text: string, fontSize: number): number {
  return text.length * fontSize;
}

describe("escapeXml", () => {
  it("escapes the five XML special characters", () => {
    assertIdentical(escapeXml(`&<>"'`), "&amp;&lt;&gt;&quot;&apos;");
  });

  it("escapes ampersands before other entities", () => {
    assertIdentical(escapeXml("a & <b>"), "a &amp; &lt;b&gt;");
  });
});

describe("wrapText", () => {
  it("wraps on word boundaries within the measured width", () => {
    assertArrayEquals(wrapText("the quick brown fox", 100, byCharacter), [
      "the quick",
      "brown fox",
    ]);
  });

  it("breaks a word too wide for a line of its own", () => {
    assertArrayEquals(wrapText("supercalifragilistic word", 100, byCharacter), [
      "supercalif",
      "ragilistic",
      "word",
    ]);
  });

  it("wraps text with no spaces in it, as Japanese is written", () => {
    assertArrayEquals(wrapText("一二三四五六七", 30, byCharacter), [
      "一二三",
      "四五六",
      "七",
    ]);
  });

  it("collapses runs of whitespace and ignores empties", () => {
    assertArrayEquals(wrapText("  a   b  ", 100, byCharacter), ["a b"]);
  });

  it("returns an empty array for blank input", () => {
    assertArrayEquals(wrapText(" ".repeat(3), 100, byCharacter), []);
  });
});

describe("breakWord", () => {
  it("keeps a whole grapheme cluster together", () => {
    // The flag is one grapheme of two code points, so a break inside it would
    // leave two letters behind rather than half a flag.
    assertArrayEquals(breakWord("🇯🇵🇯🇵", 10, byCharacter), ["🇯🇵", "🇯🇵"]);
  });

  it("returns one piece for a character wider than the line", () => {
    assertArrayEquals(breakWord("m", 1, byCharacter), ["m"]);
  });
});

describe("fitText", () => {
  const options = { maxWidth: 100, maxLines: 2, fontSize: 10, minFontSize: 5 };

  it("leaves text that already fits at its full size", () => {
    const fitted = fitText("abc def", byCharacterAt, options);

    assertIdentical(fitted.fontSize, 10);
    assertArrayEquals(fitted.lines, ["abc def"]);
  });

  it("shrinks text until it fits the line budget", () => {
    // Three lines of ten characters at size 10; at size 8 the same words fit
    // on two lines of twelve.
    const fitted = fitText("aaaa bbbb cccc dddd eeee", byCharacterAt, options);

    assertNumberBetween(fitted.fontSize, 5, 9);
    assertArrayLength(fitted.lines, 2);
  });

  it("cuts to the line budget once it has shrunk as far as it may", () => {
    const fitted = fitText("aaaa ".repeat(20), byCharacterAt, options);

    assertIdentical(fitted.fontSize, 5);
    assertArrayLength(fitted.lines, 2);
  });

  it("returns no lines for empty text", () => {
    assertArrayEquals(fitText("", byCharacterAt, options).lines, []);
  });
});

describe("layoutStack", () => {
  it("centres the block and returns increasing baselines", () => {
    const placed = layoutStack([{ fontSize: 100 }, { fontSize: 100 }], 0, 1000);

    // Two 120px advances (240 total) centred in 1000 → block starts at 380,
    // and each baseline sits 80px (0.8em) into its line.
    assertArrayLength(placed, 2);
    assertIdentical(placed[0].y, 460);
    assertIdentical(placed[1].y, 580);
  });

  it("starts at the top when the block overflows the area", () => {
    const placed = layoutStack([{ fontSize: 100 }], 100, 150);

    assertArrayLength(placed, 1);
    assertIdentical(placed[0].y, 180);
  });

  it("inserts extra space before a line with gapBefore", () => {
    const withoutGap = layoutStack(
      [{ fontSize: 100 }, { fontSize: 100 }],
      0,
      1000,
    );
    const withGap = layoutStack(
      [{ fontSize: 100 }, { fontSize: 100, gapBefore: 40 }],
      0,
      1000,
    );

    // The gap pushes the second line 40px further from the first.
    assertIdentical(baselineGap(withGap), baselineGap(withoutGap) + 40);
  });

  it("honours an explicit line height", () => {
    const placed = layoutStack(
      [
        { fontSize: 100, lineHeight: 2 },
        { fontSize: 100, lineHeight: 2 },
      ],
      0,
      1000,
    );

    // Advance is fontSize * lineHeight = 200 between baselines.
    assertArrayLength(placed, 2);
    assertIdentical(placed[1].y - placed[0].y, 200);
  });
});

describe("textElement", () => {
  it("renders required attributes and escapes content", () => {
    const svg = textElement("A & B", {
      x: 10,
      y: 20,
      fontFamily: "Arial",
      fontSize: 40,
      fontWeight: 700,
      fill: "#fff",
    });

    assertStringIncludes(svg, 'x="10"');
    assertStringIncludes(svg, 'y="20"');
    assertStringIncludes(svg, 'font-size="40"');
    assertStringIncludes(svg, 'font-weight="700"');
    assertStringIncludes(svg, ">A &amp; B</text>");
    assertStringNotIncludes(svg, "fill-opacity");
    assertStringNotIncludes(svg, "text-anchor");
  });

  it("includes optional opacity and anchor when given", () => {
    const svg = textElement("x", {
      x: 0,
      y: 0,
      fontFamily: "Arial",
      fontSize: 10,
      fontWeight: 400,
      fill: "#000",
      fillOpacity: 0.5,
      anchor: "middle",
    });

    assertStringIncludes(svg, 'fill-opacity="0.5"');
    assertStringIncludes(svg, 'text-anchor="middle"');
  });
});
