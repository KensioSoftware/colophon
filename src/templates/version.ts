import { optionalString } from "../props.js";

/**
 * The version as it is drawn, or nothing where the post named none.
 *
 * A `v` goes in front, since that is how a release is written down nearly
 * everywhere a reader will have seen one, but only where the post has not
 * written one itself. Frontmatter is hand-typed and both `1.2.0` and `v1.2.0`
 * are what somebody means by the same release, so the alternative is an image
 * that says `vv1.2.0`.
 *
 * Any leading `v` counts, not only one in front of a digit, since `vNext` and
 * `v2.0` are the same kind of label and nothing here validates a version
 * anyway. The cost is that a version that genuinely starts with a `v` and is
 * not a prefix goes unprefixed, and no such version has ever been written.
 */
export function versionLabel(value: unknown): string | undefined {
  const version = optionalString(value);

  if (version === undefined || version === "") {
    return undefined;
  }

  return version.startsWith("v") ? version : `v${version}`;
}
