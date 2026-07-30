/**
 * Visual regression: render every sample and compare it against the committed
 * baseline in `test/baselines/`.
 *
 * Templates are pictures, and until this existed a change to one was reviewed
 * as a diff of string concatenation, where nothing says whether the title moved
 * two pixels or two hundred. A failure here means the image changed; whether it
 * changed for the better is what the regenerated baseline in the pull request
 * is for.
 *
 * Run `pnpm baselines` to record them after a deliberate change, and commit the
 * PNGs alongside the code that moved them.
 */
import {
  assertNonNullable,
  assertNumberBetween,
  assertObjectEquals,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import {
  isRecording,
  readBaseline,
  writeBaseline,
  writeFailure,
} from "../test/visual/baseline.js";
import { visualSamples } from "../test/visual/cases.js";
import { decodePng } from "../test/visual/png.js";
import { renderSample } from "../test/visual/render.js";
import { compare, signature } from "../test/visual/signature.js";

/**
 * How far a cell of the signature may move, in levels out of 255, before the
 * image counts as changed.
 *
 * This is here for the rasteriser rather than for the templates. resvg does its
 * own layout and rasterising in software, without hinting, so given the same
 * font files it should produce the same bytes anywhere, and re-rendering a
 * sample against its own baseline does move every cell by exactly zero. The
 * tolerance is a guard against a machine that rounds differently somewhere, not
 * a budget anything is expected to spend.
 *
 * The number is where the smallest change worth reporting starts. Nudging the
 * footer baseline by one pixel at document scale, a third of a pixel in the
 * raster, moves the worst cell of most samples by 4 to 8, and three pixels
 * moves it by up to 24. So 4 is roughly one pixel of drift, and a template
 * change a reviewer would actually see is an order of magnitude past it. If a
 * platform ever proves noisier than resvg's determinism suggests, this is the
 * one number to raise.
 */
const tolerance = 4;

/** Rendering a 1200px document takes longer than the suite's usual budget. */
const renderTimeout = 30_000;

describe("template baselines", () => {
  for (const sample of visualSamples) {
    it(
      `renders ${sample.name} as its baseline does`,
      async () => {
        const png = await renderSample(sample);

        if (isRecording) {
          await writeBaseline(sample.name, png);
          return;
        }

        const baseline = await readBaseline(sample.name);
        assertNonNullable(
          baseline,
          `No baseline for "${sample.name}". Run \`pnpm baselines\` and commit it.`,
        );

        const rendered = decodePng(png);
        const recorded = decodePng(baseline);

        assertObjectEquals(
          { width: rendered.width, height: rendered.height },
          { width: recorded.width, height: recorded.height },
          `"${sample.name}" rendered at a different size from its baseline.`,
        );

        const difference = compare(signature(rendered), signature(recorded));
        const rendering =
          difference.max > tolerance
            ? ` What was rendered is at ${await writeFailure(sample.name, png)}.`
            : "";

        assertNumberBetween(
          difference.max,
          0,
          tolerance,
          `"${sample.name}" no longer matches its baseline: the worst cell moved` +
            ` ${difference.max.toFixed(2)} of 255 and the mean moved` +
            ` ${difference.mean.toFixed(2)}. If the change was intended, run` +
            ` \`pnpm baselines\` and commit the new image.${rendering}`,
        );
      },
      renderTimeout,
    );
  }
});
