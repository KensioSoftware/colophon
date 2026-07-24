import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import type { MetaImageProps } from "../types.js";

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
 * Options for {@link walkContent}. Only `dir` is required.
 */
export interface WalkOptions {
  /** Root directory to search recursively for content files. */
  readonly dir: string;
  /** Frontmatter key holding the image props object. Default `meta_img_props`. */
  readonly propsKey?: string;
  /** Field within the props object naming the template. Default `template`. */
  readonly templateField?: string;
  /** Template to use when the template field is absent. */
  readonly defaultTemplate?: string;
  /**
   * Top-level frontmatter field to read the post slug from (used as the base
   * filename). Default `slug`; falls back to the file/directory name.
   */
  readonly slugField?: string;
  /** File extensions to include. Default `.md` and `.markdown`. */
  readonly extensions?: readonly string[];
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
 * `undefined` if this file should be skipped (no props object, or no usable
 * template/title). Pure — no filesystem access.
 */
export function extractProps(
  frontmatter: Record<string, unknown>,
  options: Pick<
    WalkOptions,
    "propsKey" | "templateField" | "defaultTemplate"
  > = {},
): MetaImageProps | undefined {
  const propsKey = options.propsKey ?? defaultPropsKey;
  const templateField = options.templateField ?? defaultTemplateField;

  const record = frontmatter[propsKey];

  if (!isRecord(record)) {
    return undefined;
  }

  const templateRaw = record[templateField];
  const template =
    typeof templateRaw === "string" ? templateRaw : options.defaultTemplate;

  if (template === undefined) {
    return undefined;
  }

  const titleRaw = record["title"];

  if (typeof titleRaw !== "string") {
    return undefined;
  }

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
    title: titleRaw,
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
 * return the files that declare image props. This is the host-project concern
 * — finding content and reading frontmatter — kept separate from rendering.
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
