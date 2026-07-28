import type { MetaImageProps, OutputSize, ResolvedConfig } from "../types.js";

/**
 * One image to render: what to draw, how big, where it goes, and the config it
 * is drawn with. A content file becomes one job per size; a config `extra`
 * becomes a single job of its own.
 *
 * Working the paths and configs out while planning is what lets the two
 * sources meet: by the time anything is rendered there are only jobs, and
 * nothing downstream has to ask which kind of image it is holding.
 */
export interface RenderJob {
  /**
   * The content file this image came from, relative to the content root.
   * `undefined` for an extra image, which has no content file.
   */
  readonly contentPath: string | undefined;
  /**
   * The slug the page is addressed by, and the key it appears under in the
   * manifest. `undefined` for an extra image, which is not a page.
   */
  readonly slug: string | undefined;
  readonly props: MetaImageProps;
  readonly size: OutputSize;
  readonly outputPath: string;
  /** Where the image is served, if the placement knows. */
  readonly url: string | undefined;
  readonly config: ResolvedConfig;
}
