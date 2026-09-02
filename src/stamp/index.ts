import type { MetaImageProps, OutputSize, ResolvedConfig } from "../types.js";
import { configDigest } from "./config-digest.js";
import { sha256, stableStringify } from "./digest.js";

export { stampImage } from "./write.js";
export { readImageStamp } from "./read.js";

/**
 * Computes stamps for the images rendered from one resolved config.
 */
export interface Stamper {
  /**
   * The stamp for one image: a digest of the props, the config and the size it
   * was rendered from. Equal stamps mean re-rendering would produce the same
   * image.
   */
  stamp(props: MetaImageProps, size: OutputSize): string;
}

/**
 * Build a {@link Stamper} for a resolved config. Asynchronous because it reads
 * the configured font files; do it once per run rather than once per image.
 */
export async function createStamper(config: ResolvedConfig): Promise<Stamper> {
  const base = await configDigest(config);
  const templateDigests = new Map<string, string>();

  // A custom template is config the project controls, so its source counts as
  // part of the input. A built-in is hashed here as well: `resolveConfig`
  // merges `builtinTemplates` into `config.templates`, and this reads the two
  // the same way. Source text is all there is to go on: a template that reads
  // something its own code does not name, such as a closed-over value or a
  // file it loads, can change without the stamp noticing, and needs
  // `overwrite` to pick it up. That gap is where a built-in differs. The
  // modules its `render` calls are outside its own source text, and
  // `RENDER_DIGEST` in the base digest is what reaches them.
  const templateDigest = (name: string): string => {
    const cached = templateDigests.get(name);

    if (cached !== undefined) {
      return cached;
    }

    const template = config.templates[name];
    const digest =
      template === undefined ? "" : sha256(template.render.toString());
    templateDigests.set(name, digest);
    return digest;
  };

  return {
    stamp(props, size): string {
      return sha256(
        stableStringify([
          base,
          templateDigest(props.template),
          // The whole size, not just its dimensions: a size carries its own
          // config overrides, and changing one has to re-render that image.
          size,
          props,
        ]),
      );
    },
  };
}
