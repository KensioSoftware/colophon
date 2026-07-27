import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import type { ContentOptions, MetaImageProps } from "../types.js";

const defaultPropsKey = "meta_img_props";
const defaultTemplateField = "template";
const defaultSlugField = "slug";
const defaultExtensions: readonly string[] = [".md", ".markdown"];

function coerceString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  return undefined;
}

/**
 * Options for {@link walkContent}: everything a project can say about reading
 * its own content, plus the directory to read it from. Only `dir` is required.
 */
export interface WalkOptions extends ContentOptions {
  /** Root directory to search recursively for content files. */
  readonly dir: string;
}

/**
 * A discovered content file with the image props read from its frontmatter.
 */
export interface ContentFile {
  /** Path relative to the walk `dir`. */
  readonly contentPath: string;
  /** Absolute path on disk. */
  readonly absolutePath: string;
  /** Base filename for this post's images (frontmatter slug, or path-derived). */
  readonly slug: string;
  readonly props: MetaImageProps;
}

/**
 * Derive a slug from a file path: the filename without extension, or the
 * parent directory name when the file is `index.*` (the common page-bundle
 * convention).
 */
export function slugFromPath(filePath: string): string {
  const extension = path.extname(filePath);
  const base = path.basename(filePath, extension);
  return base === "index" ? path.basename(path.dirname(filePath)) : base;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Extract {@link MetaImageProps} from a parsed frontmatter object, or return
 * `undefined` if this file should be skipped (nothing to build props from, or
 * no usable template). Pure — no filesystem access.
 *
 * Props can come from two places: the post's own props object, and a project's
 * `props` mapper reading the frontmatter it already has. Where both speak the
 * post wins, field by field — the mapper describes the site's usual shape, and
 * a post that says otherwise is saying so on purpose.
 */
export function extractProps(
  frontmatter: Record<string, unknown>,
  options: Pick<
    ContentOptions,
    "propsKey" | "templateField" | "defaultTemplate" | "props"
  > = {},
): MetaImageProps | undefined {
  const propsKey = options.propsKey ?? defaultPropsKey;
  const templateField = options.templateField ?? defaultTemplateField;

  const declared = frontmatter[propsKey];
  const hasDeclared = isRecord(declared);
  const mapped = options.props?.(frontmatter);

  // A mapper opting a post out cannot overrule a post that asked for an image
  // outright, so the skip only applies where the post says nothing itself.
  if (!hasDeclared && mapped === undefined) {
    return undefined;
  }

  // Merged rather than replaced, so a post correcting one field does not have
  // to restate everything the mapper already got right.
  const record: Record<string, unknown> = {
    ...mapped,
    ...(hasDeclared && declared),
  };

  const templateRaw = record[templateField];
  const template =
    typeof templateRaw === "string" ? templateRaw : options.defaultTemplate;

  if (template === undefined) {
    return undefined;
  }

  // Title is optional: templates such as `code` describe the image entirely
  // from their own fields, and requiring a title would be pure boilerplate.
  const title = coerceString(record["title"]);
  const subtitle = coerceString(record["subtitle"]);
  const version = coerceString(record["version"]);

  const extras: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (
      key !== templateField &&
      key !== "template" &&
      key !== "title" &&
      key !== "subtitle" &&
      key !== "version"
    ) {
      extras[key] = value;
    }
  }

  return {
    ...extras,
    template,
    ...(title !== undefined && { title }),
    ...(subtitle !== undefined && { subtitle }),
    ...(version !== undefined && { version }),
  };
}

async function collectContentFiles(
  dir: string,
  extensions: readonly string[],
): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });

  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return collectContentFiles(entryPath, extensions);
      }

      if (
        entry.isFile() &&
        extensions.some((extension) => entry.name.endsWith(extension))
      ) {
        return [entryPath];
      }

      return [];
    }),
  );

  return nested.flat();
}

/**
 * Walk a content tree, read each file's frontmatter with `gray-matter`, and
 * return the files that image props can be built for. This is the host-project
 * concern — finding content and reading frontmatter — kept separate from
 * rendering.
 */
export async function walkContent(
  options: WalkOptions,
): Promise<ContentFile[]> {
  const extensions = options.extensions ?? defaultExtensions;
  const filePaths = await collectContentFiles(options.dir, extensions);

  const slugField = options.slugField ?? defaultSlugField;

  const files = await Promise.all(
    filePaths.map(async (filePath) => {
      const raw = await readFile(filePath, "utf8");
      const frontmatter: Record<string, unknown> = matter(raw).data;
      const props = extractProps(frontmatter, options);

      if (props === undefined) {
        return;
      }

      const declaredSlug = coerceString(frontmatter[slugField])?.trim();
      const slug =
        declaredSlug !== undefined && declaredSlug !== ""
          ? declaredSlug
          : slugFromPath(filePath);

      return {
        contentPath: path.relative(options.dir, filePath),
        absolutePath: filePath,
        slug,
        props,
      };
    }),
  );

  return files.filter((file): file is ContentFile => file !== undefined);
}
