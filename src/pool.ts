/**
 * Map over `items` with at most `limit` calls to `worker` in flight at once,
 * returning the results in input order.
 *
 * `Promise.all` over a mapped array starts everything at once, which for a
 * few hundred images means a few hundred rasterisations queued on the thread
 * pool with every pending bitmap held in memory. This starts `limit` workers
 * instead and lets each pull the next item as it finishes, so the work in
 * flight stays bounded however large the input is.
 *
 * The first rejection propagates, as it would from `Promise.all`. Items
 * already in flight run to completion — there is no cancelling a render — but
 * no further ones are started.
 *
 * Throws if `limit` is not a positive integer.
 */
export async function mapConcurrent<Item, Result>(
  items: readonly Item[],
  limit: number,
  worker: (item: Item, index: number) => Promise<Result>,
): Promise<Result[]> {
  // A limit below one starts no workers at all, and an empty `Promise.all`
  // resolves happily — so the caller would get an empty result back as though
  // there had been nothing to do. A build reporting success having rendered
  // nothing is the failure worth being loud about.
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error(
      `Invalid concurrency limit ${String(limit)}; expected a positive integer.`,
    );
  }

  // Assigned by index rather than pushed, so results come back in input order
  // however the workers interleave.
  const results: Result[] = [];
  // One shared iterator is the queue: each worker pulls the next entry when it
  // is free, so a slow item holds up only itself rather than a fixed share of
  // the work.
  const queue = items.entries();
  let isStopped = false;

  async function run(): Promise<void> {
    for (const [index, item] of queue) {
      if (isStopped) {
        return;
      }
      // Awaiting in the loop is the whole point: a worker takes one item at a
      // time, and the parallelism comes from there being several of them.
      // eslint-disable-next-line no-await-in-loop
      results[index] = await worker(item, index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    run(),
  );

  try {
    await Promise.all(workers);
  } catch (error) {
    // The run is already lost, so stop feeding it: a build that fails on the
    // first file should not render the rest of the tree before it exits.
    isStopped = true;
    throw error;
  }

  return results;
}
