import path from "node:path";

import {
  assertArrayEquals,
  assertIdentical,
  assertNumberBetween,
  assertStringIncludes,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { resolveConfig } from "./config/index.js";
import { createMeasurer } from "./measure/index.js";
import { estimateWidth } from "./measure/estimate.js";
import { familyNames } from "./measure/select.js";
import type { ColophonConfig, MeasureText } from "./types.js";

// Real font files, as `fonts.test.ts` does: measuring is only worth testing
// against advances a rasteriser would agree with.
const fontDir = path.join(process.cwd(), "node_modules/dejavu-fonts-ttf/ttf");
const sansFont = path.join(fontDir, "DejaVuSans.ttf");
const boldFont = path.join(fontDir, "DejaVuSans-Bold.ttf");

async function measurer(config: ColophonConfig = {}): Promise<MeasureText> {
  return createMeasurer(resolveConfig(config));
}

const dejaVu: ColophonConfig = {
  fonts: [
    { family: "DejaVu Sans", path: sansFont },
    { family: "DejaVu Sans", path: boldFont },
  ],
};

describe("familyNames", () => {
  it("reads a stack in order, unquoted", () => {
    assertArrayEquals(familyNames('"JetBrains Mono", Menlo , monospace'), [
      "JetBrains Mono",
      "Menlo",
      "monospace",
    ]);
  });
});

describe("estimateWidth", () => {
  it("counts a full-width character as a whole em", () => {
    assertIdentical(estimateWidth("日本", 100, 400), 200);
  });

  it("makes a heavier weight wider", () => {
    // Five characters at 0.52 em is 260 for a regular weight, a tenth more
    // for a heavy one.
    assertIdentical(estimateWidth("Hello", 100, 400), 260);
    assertNumberBetween(estimateWidth("Hello", 100, 800), 285, 287);
  });
});

describe("createMeasurer", () => {
  it("measures against a configured font", async () => {
    const measure = await measurer(dejaVu);

    // DejaVu Sans sets "Hello world" at 5.606 em, which is the advance the
    // rasteriser will use for the same string.
    assertNumberBetween(
      measure("Hello world", { fontFamily: "DejaVu Sans", fontSize: 100 }),
      560,
      561,
    );
  });

  it("measures the bold cut for a bold weight", async () => {
    const measure = await measurer(dejaVu);
    const style = { fontFamily: "DejaVu Sans", fontSize: 100 };

    // The bold face sets the same words 14% wider than the regular one, which
    // is the sort of difference a single fudge factor cannot carry.
    assertNumberBetween(
      measure("Hello world", { ...style, fontWeight: 700 }),
      639,
      641,
    );
  });

  it("scales linearly with the font size", async () => {
    const measure = await measurer(dejaVu);
    const style = { fontFamily: "DejaVu Sans", fontSize: 10 };

    assertIdentical(
      measure("Colophon", { ...style, fontSize: 200 }),
      measure("Colophon", style) * 20,
    );
  });

  it("measures against the bundled faces when nothing is configured", async () => {
    const measure = await measurer();

    // Latin text is measured rather than estimated even for a project that
    // configured nothing, because Outfit ships with the package. A stack
    // naming nothing loaded is drawn in it, since it is what `fallbackFamily`
    // hands the rasteriser, so measuring against it is measuring what appears.
    assertIdentical(
      measure("abcde", { fontFamily: "Arial", fontSize: 100 }),
      measure("abcde", { fontFamily: "Outfit", fontSize: 100 }),
    );
  });

  it("estimates the characters even the bundled faces do not cover", async () => {
    const measure = await measurer();

    // Outfit and JetBrains Mono are Latin, so a CJK title still falls to the
    // estimate: a whole em per character rather than the notdef box.
    assertIdentical(
      measure("日本語", { fontFamily: "Arial", fontSize: 100 }),
      300,
    );
  });

  it("takes the caller's fallback ratio for text it cannot measure", async () => {
    const measure = await measurer();
    // Devanagari, which nothing bundled covers and which the estimator does
    // not treat as full-width, so the caller's ratio is what decides it.
    const style = { fontFamily: "Menlo", fontSize: 100 };

    assertIdentical(measure("कककक", { ...style, fallbackRatio: 0.6 }), 240);
  });

  it("falls back to a loaded face when system fonts are off", async () => {
    const measure = await measurer(dejaVu);

    // The rasteriser is handed the first configured family as its default, so
    // a stack naming nothing loaded is drawn, and measured, in that.
    assertIdentical(
      measure("Colophon", { fontFamily: "Nothing Here", fontSize: 100 }),
      measure("Colophon", { fontFamily: "DejaVu Sans", fontSize: 100 }),
    );
  });

  it("estimates the characters no loaded face covers", async () => {
    const measure = await measurer(dejaVu);
    const style = { fontFamily: "DejaVu Sans", fontSize: 100 };

    // DejaVu Sans has no CJK, and neither has anything else configured, so the
    // estimate stands in: a full em per character, rather than the notdef box
    // the font would otherwise report.
    assertIdentical(measure("日本語", style), 300);
  });

  it("reports a font file it cannot read for measurement", async () => {
    const warnings: string[] = [];
    const measure = await measurer({
      fonts: [{ data: new Uint8Array([1, 2, 3, 4]) }],
      systemFonts: true,
      onWarning: (message) => {
        warnings.push(message);
      },
    });

    assertStringIncludes(warnings[0] ?? "", "text measurement");
    // The unreadable font is reported and then ignored, and the text is still
    // measured, against the bundled faces the build has regardless.
    assertIdentical(
      measure("abc", { fontFamily: "x", fontSize: 10 }),
      measure("abc", { fontFamily: "Outfit", fontSize: 10 }),
    );
  });
});
