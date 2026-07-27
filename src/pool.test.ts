import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

import {
  assertArrayEquals,
  assertIdentical,
  assertThrowsErrorAsync,
} from "@kensio/smartass";
import { describe, it } from "vitest";

import { mapConcurrent } from "./pool.js";

/**
 * A promise plus the handle to settle it, so a test can hold work open for
 * exactly as long as it wants and assert on what the pool did meanwhile. That
 * is what keeps these tests off wall-clock timing.
 */
function gate(): { promise: Promise<unknown>; release: () => void } {
  const target = new EventTarget();
  // Listening happens here, before the test has any handle to release it.
  const promise = once(target, "release");

  return {
    promise,
    release: () => {
      target.dispatchEvent(new Event("release"));
    },
  };
}

describe("mapConcurrent", () => {
  it("returns results in input order however the workers interleave", async () => {
    // Later items finish first, so pushing results as they arrive would give
    // the wrong order.
    const results = await mapConcurrent([3, 2, 1], 3, async (item) => {
      await delay(item);
      return `item ${String(item)}`;
    });

    assertArrayEquals(results, ["item 3", "item 2", "item 1"]);
  });

  it("returns nothing for no items, without calling the worker", async () => {
    let calls = 0;

    const results = await mapConcurrent([], 4, (item) => {
      calls += 1;
      return Promise.resolve(item);
    });

    assertArrayEquals(results, []);
    assertIdentical(calls, 0);
  });

  it("starts only the limit, then one more as each finishes", async () => {
    const gates = [gate(), gate(), gate(), gate()];
    const started: number[] = [];

    const all = mapConcurrent([0, 1, 2, 3], 2, async (item) => {
      started.push(item);
      await gates[item]?.promise;
      return item;
    });

    // The workers start synchronously, so the limit is reached before anything
    // has had the chance to finish.
    assertArrayEquals(started, [0, 1]);

    gates[0]?.release();
    await delay(0);
    assertArrayEquals(started, [0, 1, 2]);

    gates[1]?.release();
    gates[2]?.release();
    gates[3]?.release();
    assertArrayEquals(await all, [0, 1, 2, 3]);
    assertArrayEquals(started, [0, 1, 2, 3]);
  });

  it("runs fewer workers than the limit when there is less work", async () => {
    let inFlight = 0;
    let peak = 0;

    const results = await mapConcurrent([1, 2], 8, async (item) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await delay(1);
      inFlight -= 1;
      return item;
    });

    assertArrayEquals(results, [1, 2]);
    assertIdentical(peak, 2);
  });

  it("propagates the first failure and stops starting new items", async () => {
    const held = gate();
    const started: number[] = [];

    const all = mapConcurrent([0, 1, 2, 3], 2, async (item) => {
      started.push(item);
      if (item === 0) {
        throw new Error("render failed");
      }
      await held.promise;
      return item;
    });

    const error = await assertThrowsErrorAsync(async () => all);
    assertIdentical(error.message, "render failed");

    // The item that was already in flight finishes; the queued ones are never
    // picked up.
    held.release();
    await delay(0);
    assertArrayEquals(started, [0, 1]);
  });
});
