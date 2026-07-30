import { generate } from "../generate/index.js";
import type { GenerateOptions } from "../generate/index.js";

/**
 * The shape Astro wants an integration to be.
 *
 * Declared here rather than imported from `astro`, so that installing Colophon
 * does not drag a framework in and a project on any Astro version can use this
 * one. It is structural: what matters is that the object fits where an
 * integration goes, and a zero-argument hook fits a slot expecting one that
 * takes the build's context.
 */
export interface AstroIntegration {
  readonly name: string;
  readonly hooks: {
    // Astro's name for its own hook, so it is not this project's to camelCase.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly "astro:config:setup": () => Promise<void>;
  };
}

/** What the integration needs, which is what `generate` needs. */
export type ColophonIntegrationOptions = GenerateOptions;

/**
 * Render the site's meta images as part of an Astro build.
 *
 * ```js
 * // astro.config.mjs
 * import colophon from "@kensio/colophon/astro";
 *
 * export default defineConfig({
 *   integrations: [
 *     colophon({
 *       contentDir: "src/content",
 *       config: { manifest: "src/data/colophon.json", footer: "example.com" },
 *     }),
 *   ],
 * });
 * ```
 *
 * It runs on `astro:config:setup`, which is the one hook that fires for
 * `astro dev` as well as `astro build`, and which runs before anything is
 * rendered. Both matter: the manifest has to be on disk before a page that
 * reads it is built, and a dev server should show the images the build will
 * produce rather than whatever the last build left behind.
 *
 * Running on every dev start sounds expensive and is not, because of the
 * rebuild stamps: a second run reads the content tree, compares digests and
 * renders nothing. The manifest is rewritten either way, being a small file
 * describing images that are already there. Only the first run in a session
 * pays for rendering, and only for the images that changed.
 */
export default function colophon(
  options: ColophonIntegrationOptions,
): AstroIntegration {
  return {
    name: "@kensio/colophon",
    hooks: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "astro:config:setup": async (): Promise<void> => {
        await generate(options);
      },
    },
  };
}
