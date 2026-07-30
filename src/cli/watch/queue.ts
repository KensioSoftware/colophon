import { messageOf } from "../message.js";

/** A rebuild waiting to happen, or happening. */
export interface RebuildQueue {
  /** Note that something changed, and rebuild once the changes stop. */
  touch(): void;
}

/** How a queue is driven. */
export interface QueueOptions {
  readonly run: () => Promise<void>;
  /** How long to wait for a burst of changes to finish. */
  readonly delayMs?: number;
  readonly onError?: (error: unknown) => void;
}

/**
 * Long enough to swallow the several events one save produces, short enough
 * that the rebuild still feels like a consequence of hitting save.
 */
const defaultDelayMs = 80;

/**
 * Coalesce change events into rebuilds.
 *
 * Two things have to hold for a watch loop to behave. Saving a file produces
 * more than one event, since editors write, rename and touch mtimes in their
 * own order, so events are held for `delayMs` and the wait restarts while they
 * keep arriving. And a build takes longer than the edit that triggered it, so a
 * change arriving mid-build queues one more run rather than starting a second
 * build alongside the first.
 */
export function createRebuildQueue(options: QueueOptions): RebuildQueue {
  const delayMs = options.delayMs ?? defaultDelayMs;
  const report =
    options.onError ??
    ((error: unknown): void => {
      console.error(messageOf(error));
    });

  let timer: NodeJS.Timeout | undefined;
  let isRunning = false;
  let isPending = false;

  async function drain(): Promise<void> {
    isRunning = true;

    try {
      await options.run();
    } catch (error) {
      // A failed build must not take the watcher with it. The mistake is
      // usually in the file that was just saved, so the fix is the next save.
      report(error);
    }

    isRunning = false;

    if (isPending) {
      isPending = false;
      // Called rather than awaited, so `drain` does not recurse into a chain
      // of promises that a long watch session would hold open.
      void drain();
    }
  }

  return {
    touch(): void {
      if (isRunning) {
        isPending = true;
        return;
      }

      clearTimeout(timer);
      timer = setTimeout(() => {
        void drain();
      }, delayMs);
    },
  };
}
