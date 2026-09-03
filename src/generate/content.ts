import { walkContent } from "../content/index.js";
import { assertSlugStaysInside } from "../content/slug.js";
import type { ContentFile } from "../types.js";
import { isRecord } from "../validate/check.js";
import type { GenerateOptions } from "./options.js";

/**
 * Reject a content path that would put an image outside the tree.
 *
 * A walk takes this path relative to the directory it started in, so it always
 * points inwards. A supplied one is written by hand, and `beside-content`
 * places an image in the directories the path carries. `../../x/y.json` is an
 * image written two levels above the content root.
 */
function assertContentPathStaysInside(contentPath: string): void {
  const segments = contentPath.split(/[/\\]/);
  const isEscaping =
    segments.includes("..") ||
    segments[0] === "" ||
    /^[A-Za-z]:/.test(contentPath);

  if (isEscaping) {
    throw new TypeError(
      `Invalid contentPath "${contentPath}": it is where the page sits under` +
        ` the content root, so it cannot be absolute or climb out with "..".`,
    );
  }
}

/**
 * Reject content a build cannot render.
 *
 * A walk builds its own {@link ContentFile}s, so all of this is already true of
 * what it returns. A project passing `contentFiles` builds them out of whatever
 * its pages live in, and a plain JavaScript caller has nothing between a
 * missing field and a failure somewhere under the rasteriser. The slug is the
 * one that matters beyond a confusing message: it becomes part of a filename,
 * and a build writes what it is handed.
 *
 * It sits with the build rather than in `validate/`, which checks config keys,
 * for the reason `placement/check.ts` does: what a value has to be is known by
 * whatever is about to use it.
 */
export function assertContentFiles(files: readonly ContentFile[]): void {
  for (const [index, file] of files.entries()) {
    // The types require all of this; a caller in plain JavaScript does not.
    const declared = file as {
      readonly contentPath?: unknown;
      readonly slug?: unknown;
      readonly props?: unknown;
    };
    const where = `contentFiles[${String(index)}]`;

    if (
      typeof declared.contentPath !== "string" ||
      declared.contentPath === ""
    ) {
      throw new TypeError(
        `${where} needs a contentPath: the page's path under the content root,` +
          ` which is what names it in warnings and in the manifest.`,
      );
    }

    if (typeof declared.slug !== "string" || declared.slug === "") {
      throw new TypeError(
        `${where} (${declared.contentPath}) needs a slug: the base filename its` +
          ` images are written under.`,
      );
    }

    if (!isRecord(declared.props)) {
      throw new TypeError(
        `${where} (${declared.contentPath}) needs a props object saying what to` +
          ` draw. It is the same shape a post's frontmatter declares.`,
      );
    }

    assertContentPathStaysInside(declared.contentPath);
    assertSlugStaysInside(declared.slug, declared.contentPath);
  }
}

/**
 * Where this build's content comes from: what the caller handed over, or a
 * walk of `contentDir`.
 *
 * Settled before anything else a plan does, and the walk left until it is
 * asked for, so that a build with nothing to render says that rather than
 * failing over where the images it does not have would have gone.
 *
 * Content options describe reading frontmatter out of a file, so a build given
 * its content outright has nothing to apply them to. `config.content` is left
 * alone, since a project sets that once for the CLI and the playground as
 * well, but `walk` is the programmatic override and passing it here can only
 * be a misunderstanding.
 */
export function contentSource(
  options: GenerateOptions,
): () => Promise<readonly ContentFile[]> {
  const files = options.contentFiles;

  if (files !== undefined) {
    if (options.walk !== undefined) {
      throw new Error(
        `generate takes contentFiles or walk options, not both: walk options` +
          ` say how to read frontmatter out of a file, and contentFiles is` +
          ` content that has already been read.`,
      );
    }

    assertContentFiles(files);
    return () => Promise.resolve(files);
  }

  const dir = options.contentDir;

  if (dir === undefined) {
    throw new Error(
      `generate needs a contentDir to walk for content, or contentFiles to` +
        ` render content the project already has.`,
    );
  }

  // Content options can come from the config module, which is the only route
  // a CLI user has to them; `walk` is the programmatic override and wins.
  return () =>
    walkContent({ dir, ...options.config?.content, ...options.walk });
}
