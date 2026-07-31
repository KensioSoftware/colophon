import type { FileHandle } from "node:fs/promises";
import { open } from "node:fs/promises";

import type { StampCarrier } from "./carrier/index.js";
import { carrierFor } from "./carrier/index.js";

/**
 * How much of a file to read when looking for a stamp. Every carrier puts it
 * within this much of one end or the other, so a build reads at most two of
 * these per image. Reading whole images back to compare a hash would defeat
 * the point of skipping them.
 */
const windowBytes = 4096;

async function readAt(
  handle: FileHandle,
  position: number,
  length: number,
): Promise<Buffer> {
  const buffer = Buffer.alloc(length);
  const { bytesRead } = await handle.read(buffer, 0, length, position);
  return buffer.subarray(0, bytesRead);
}

/** The window a carrier reads from; for a short file that is the whole of it. */
async function windowFor(
  carrier: StampCarrier,
  handle: FileHandle,
  head: Buffer,
): Promise<Buffer> {
  if (carrier.end === "head" || head.length < windowBytes) {
    return head;
  }

  const { size } = await handle.stat();
  return readAt(handle, size - windowBytes, windowBytes);
}

async function stampIn(handle: FileHandle): Promise<string | undefined> {
  const head = await readAt(handle, 0, windowBytes);
  const carrier = carrierFor(head);

  return carrier === undefined
    ? undefined
    : carrier.read(await windowFor(carrier, handle, head));
}

/**
 * Read the stamp out of an image file. Returns `undefined` when the file is
 * missing, unreadable, in a format no carrier knows, or carries no stamp, all
 * of which mean the image cannot be shown to be up to date, so it should be
 * rendered again.
 */
export async function readImageStamp(
  file: string,
): Promise<string | undefined> {
  let handle: FileHandle;

  try {
    handle = await open(file, "r");
  } catch {
    return undefined;
  }

  try {
    return await stampIn(handle);
  } finally {
    await handle.close();
  }
}
