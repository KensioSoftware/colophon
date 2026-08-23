import type { WarningHandler } from "../types.js";

/**
 * How many threads libuv starts when `UV_THREADPOOL_SIZE` says nothing, and
 * the largest pool it will build however big the setting is.
 */
const DEFAULT_POOL_SIZE = 4;
const MAX_POOL_SIZE = 1024;

/**
 * How many threads this process's libuv pool has.
 *
 * The pool is sized once from the environment, the first time anything asks it
 * to do work. A `process.env.UV_THREADPOOL_SIZE` written from inside the
 * process arrives after that moment and changes nothing. This function only
 * reads.
 *
 * libuv reads the setting with `atoi` and treats a zero as unset, and an
 * unparseable value gives it a zero. Anything short of a positive integer
 * therefore reads back here as the default.
 */
export function threadPoolSize(
  setting: string | undefined = process.env["UV_THREADPOOL_SIZE"],
): number {
  const parsed = Number(setting);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return DEFAULT_POOL_SIZE;
  }

  return Math.min(parsed, MAX_POOL_SIZE);
}

/** What to say about a concurrency the pool is too small to serve. */
function message(concurrency: number, poolSize: number): string {
  return (
    `Rendering ${String(concurrency)} images at once, but the libuv thread` +
    ` pool has ${String(poolSize)} threads. Rasterising, PNG recompression` +
    ` and quantising all run on that pool, so only ${String(poolSize)}` +
    " renders make progress at a time. Set" +
    ` UV_THREADPOOL_SIZE=${String(concurrency)} in the environment before the` +
    " process starts to lift the ceiling."
  );
}

/**
 * A warner that says the concurrency a build asked for is above what the
 * thread pool can serve, and says it once.
 *
 * Once, because the ceiling belongs to the process. A watch rebuilding on
 * every content change would otherwise repeat the same line all day, and no
 * build can act on it while it runs. The state lives in the returned function,
 * so a test can hold one of its own and the shared warner stays shared.
 */
export function createThreadPoolWarner(): (
  concurrency: number,
  onWarning: WarningHandler,
  poolSize?: number,
) => void {
  let hasWarned = false;

  return (concurrency, onWarning, poolSize = threadPoolSize()) => {
    if (hasWarned || concurrency <= poolSize) {
      return;
    }

    hasWarned = true;
    onWarning(message(concurrency, poolSize));
  };
}

/**
 * Tell a build that its concurrency is capped by the thread pool. One warner
 * for the process, so every build in it shares the one warning.
 */
export const warnIfPoolIsSmaller = createThreadPoolWarner();
