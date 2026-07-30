import { optionalString } from "../props.js";

/**
 * The version as it is drawn, or nothing where the post named none.
 *
 * A `v` goes in front, since that is how a release is written down nearly
 * everywhere a reader will have seen one, but only where the post has not
 * written one itself. Frontmatter is hand-typed and both `1.2.0` and `v1.2.0`
 * are what somebody means by the same release, so the alternative is an image
 * that says `vv1.2.0`.
 */
export function versionLabel(value: unknown): string | undefined {
  const version = optionalString(value);

  if (version === undefined || version === "") {
    return undefined;
  }

  return /^v\d/.test(version) ? version : `v${version}`;
}
