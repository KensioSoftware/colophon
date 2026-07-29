import type { ContentOptions, MetaImageProps } from "../types.js";

const defaultPropsKey = "meta_img_props";
const defaultTemplateField = "template";

/** Read a frontmatter scalar as a string, ignoring anything else. */
export function coerceString(value: unknown): string | undefined {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The fields the props shape names itself, which never become extras. */
const namedFields = new Set(["template", "title", "subtitle", "version"]);

/**
 * Extract {@link MetaImageProps} from a parsed frontmatter object, or return
 * `undefined` if this file should be skipped (nothing to build props from, or
 * no usable template). Pure, with no filesystem access.
 *
 * Props can come from two places: the post's own props object, and a project's
 * `props` mapper reading the frontmatter it already has. Where both speak the
 * post wins, field by field. The mapper describes the site's usual shape, and
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
    if (key !== templateField && !namedFields.has(key)) {
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
