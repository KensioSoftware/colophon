import { optionalString } from "../../props.js";
import type { Badge, MetaImageProps, ResolvedConfig } from "../../types.js";

/**
 * Read a badge out of the object a post declared, field by field, the way
 * every other prop is read. What frontmatter yields is a plain value rather
 * than the interface the compiler was shown, so a badge is built here from
 * what is actually there instead of being passed along as one.
 *
 * Returns `undefined` for an object carrying no text, since the text is the
 * badge and there is nothing to draw without it.
 */
function badgeFromProps(declared: object): Badge | undefined {
  const text = optionalString("text" in declared ? declared.text : undefined);

  if (text === undefined || text === "") {
    return undefined;
  }

  const color = optionalString(
    "color" in declared ? declared.color : undefined,
  );
  const background = optionalString(
    "background" in declared ? declared.background : undefined,
  );

  return {
    text,
    ...(color !== undefined && { color }),
    ...(background !== undefined && { background }),
  };
}

/**
 * The badge to draw: the one the post declares, or the configured one where it
 * declares nothing.
 *
 * A badge in config is the same badge on every image a site renders, and a
 * post the badge does not describe has no other way to be rid of it. `false`
 * is that way out, and an object is the same door in the other direction, so a
 * post can carry a badge of its own without the config knowing about it.
 *
 * Anything else is a mistake in the frontmatter. It is reported and the
 * configured badge is drawn, which leaves the post with the image it would
 * have had if it had said nothing at all.
 */
export function badgeFor(
  props: MetaImageProps,
  config: ResolvedConfig,
): Badge | undefined {
  // Widened because this arrives from a post's frontmatter: the declared type
  // is what a project means to write, not what the file holds.
  const declared: unknown = props.badge;

  if (declared === undefined) {
    return config.badge;
  }

  if (declared === false) {
    return undefined;
  }

  const badge =
    typeof declared === "object" && declared !== null
      ? badgeFromProps(declared)
      : undefined;

  if (badge === undefined) {
    config.onWarning(
      "props.badge is neither a badge nor false, so the configured badge was" +
        " drawn. Give it an object with the `text` to draw, or `false` for no" +
        " badge on this image.",
    );

    return config.badge;
  }

  return badge;
}
