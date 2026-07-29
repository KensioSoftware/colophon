import type { Placement } from "../types.js";

/**
 * Reject a placement that cannot place anything.
 *
 * The types require all of this, but a CLI user's config module is plain
 * JavaScript with nothing checking it, and none of these omissions fails
 * anywhere near the config: a missing `dir` surfaces as a complaint about an
 * argument to `path`, and the rest as something not being a function. Key
 * validation is no help either, since it is the option that is not there.
 *
 * This sits here rather than in `validate/`, which checks keys and the names
 * of closed sets, for the reason `fonts/resolve.ts` does: what a value has to
 * be is known by whatever is about to use it.
 */
export function assertPlacement(placement: Placement): void {
  const declared = placement as {
    readonly dir?: unknown;
    readonly urlBase?: unknown;
    readonly hash?: unknown;
    readonly path?: unknown;
    readonly url?: unknown;
  };

  if (declared.urlBase !== undefined && typeof declared.urlBase !== "string") {
    throw new TypeError(
      `placement urlBase must be a string; it is prefixed to each image's path.`,
    );
  }

  if (declared.hash !== undefined && typeof declared.hash !== "boolean") {
    throw new TypeError(
      `placement hash must be true or false. Anything else reads as neither,` +
        ` so the images would be written unhashed without a word about it.`,
    );
  }

  if (placement.strategy === "public-dir") {
    if (typeof declared.dir !== "string" || declared.dir === "") {
      throw new TypeError(
        `placement "public-dir" needs a "dir" to write the images into.`,
      );
    }
    return;
  }

  if (placement.strategy !== "custom") {
    return;
  }

  if (typeof declared.path !== "function") {
    throw new TypeError(
      `placement "custom" needs a "path" function saying where each image goes.`,
    );
  }

  if (declared.url !== undefined && typeof declared.url !== "function") {
    throw new TypeError(
      `placement "custom" takes a "url" function, or none at all for images` +
        ` that are written but not served.`,
    );
  }
}
