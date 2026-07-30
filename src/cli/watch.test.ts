import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import {
  assertArrayLength,
  assertArrayMinLength,
  assertFalse,
  assertIdentical,
  assertTrue,
} from "@kensio/smartass";
import { afterEach, beforeEach, describe, it, vi } from "vitest";

import { isContentChange } from "./watch/filter.js";
import { watchContent } from "./watch/index.js";
import { createRebuildQueue } from "./watch/queue.js";

/**
 * Poll rather than sleep for a fixed time, so a slow machine still passes.
 *
 * At least `count`, not exactly: how many events one saved file produces is the
 * operating system's business. Creating a file emits both a rename and a change
 * under inotify, and where those land either side of the coalescing window is
 * exactly what makes the count vary. A test that needs an exact number drives
 * the queue itself, where nothing is watching a real directory.
 */
async function waitForBuilds(runs: string[], count: number): Promise<void> {
  await vi.waitFor(
    () => {
      assertArrayMinLength(runs, count);
    },
    {
      timeout: 2000,
      interval: 10,
    },
  );
}

describe("isContentChange", () => {
  const extensions = [".md", ".markdown"];

  it("rebuilds for a post", () => {
    assertTrue(isContentChange(path.join("post", "index.md"), extensions));
  });

  it("ignores the images the build itself writes", () => {
    // The default placement puts them next to the post, so every build changes
    // the tree it is watching.
    assertFalse(isContentChange(path.join("post", "post-og.png"), extensions));
  });

  it("ignores an editor's own files around a save", () => {
    assertFalse(isContentChange("index.md~", extensions));
    assertFalse(isContentChange(".index.md.swp", extensions));
  });
});

describe("createRebuildQueue", () => {
  it("builds once for a burst of changes", async () => {
    let runs = 0;
    const queue = createRebuildQueue({
      run: () => {
        runs += 1;
        return Promise.resolve();
      },
      delayMs: 1,
    });

    queue.touch();
    queue.touch();
    queue.touch();
    await delay(30);

    assertIdentical(runs, 1);
  });

  it("queues one more build for a change that lands mid-build", async () => {
    const started: string[] = [];
    // A build slow enough that the next change is bound to arrive during it.
    const queue = createRebuildQueue({
      run: () => {
        started.push("build");
        return delay(100);
      },
      delayMs: 1,
    });

    queue.touch();
    await waitForBuilds(started, 1);

    queue.touch();
    await delay(20);
    // Still the one build: a second alongside it would race for the same files.
    assertArrayLength(started, 1);

    // And then the change it was told about is built, once the first is done.
    await waitForBuilds(started, 2);
  });

  it("keeps watching after a build that failed", async () => {
    const errors: unknown[] = [];
    const runs: string[] = [];
    const queue = createRebuildQueue({
      run: () => {
        runs.push("build");
        return Promise.reject(new Error("no such template"));
      },
      delayMs: 1,
      onError: (error) => {
        errors.push(error);
      },
    });

    queue.touch();
    await waitForBuilds(runs, 1);
    queue.touch();
    await waitForBuilds(runs, 2);

    // The mistake is usually in the file just saved, so the fix is the next one.
    assertArrayLength(errors, 2);
  });
});

describe("watchContent", () => {
  let dir: string;
  let controller: AbortController;

  beforeEach(async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    controller = new AbortController();
    dir = await mkdtemp(path.join(tmpdir(), "colophon-watch-"));
  });

  afterEach(async () => {
    controller.abort();
    await rm(dir, { recursive: true, force: true });
  });

  it("builds up front and again when a post is written", async () => {
    const builds: string[] = [];
    const watching = watchContent({
      dir,
      extensions: [".md"],
      delayMs: 1,
      signal: controller.signal,
      build: () => {
        builds.push("build");
        return Promise.resolve();
      },
    });

    await waitForBuilds(builds, 1);
    await writeFile(path.join(dir, "post.md"), "---\ntitle: Post\n---\n");
    await waitForBuilds(builds, 2);

    controller.abort();
    await watching;
  }, 5000);
});
