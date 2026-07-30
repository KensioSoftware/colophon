import { watch } from "node:fs";

import { isContentChange } from "./filter.js";
import { createRebuildQueue } from "./queue.js";

/** What a watch run needs: where to look, what counts, and what to run. */
export interface WatchOptions {
  readonly dir: string;
  /** File extensions the build reads, which is what a change has to be. */
  readonly extensions: readonly string[];
  readonly build: () => Promise<void>;
  /** Coalescing window, for tests that would rather not wait for it. */
  readonly delayMs?: number;
  /** Stop watching. The CLI watches until the process ends; tests do not. */
  readonly signal?: AbortSignal;
}

/**
 * Build the tree, then rebuild it whenever a content file changes, until the
 * process is stopped.
 *
 * The returned promise settles when the watcher stops or fails, which is what
 * keeps the process alive: there is nothing else to await once the first build
 * is done. The watcher is registered before that build starts, so an edit made
 * while it runs is not lost.
 *
 * Only the content tree is watched. A change to the config module is not picked
 * up, because reloading it would mean importing it again under a fresh URL and
 * leaving the old copy behind, and the modules it imports could not be
 * invalidated at all. Restart the watch after editing a config.
 */
export async function watchContent(options: WatchOptions): Promise<void> {
  const queue = createRebuildQueue({
    run: options.build,
    ...(options.delayMs !== undefined && { delayMs: options.delayMs }),
  });

  const watcher = watch(
    options.dir,
    {
      recursive: true,
      ...(options.signal !== undefined && { signal: options.signal }),
    },
    (_event, filename) => {
      if (filename !== null && isContentChange(filename, options.extensions)) {
        queue.touch();
      }
    },
  );

  console.log(`Watching ${options.dir} for changes. Press Ctrl+C to stop.`);
  queue.touch();

  return new Promise<void>((resolve, reject) => {
    watcher.on("close", resolve);
    watcher.on("error", reject);
  });
}
