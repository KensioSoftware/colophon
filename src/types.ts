/**
 * Pixel dimensions for a single rendered image.
 */
export interface Dimensions {
  readonly width: number;
  readonly height: number;
}

/**
 * A named output size. The `name` identifies the size in output filenames
 * (e.g. `og`, `square`) and must be unique within a config, so every
 * generated image gets a distinct, descriptive filename.
 *
 * A size may also carry {@link SizeOverrides}, applied only when rendering it.
 */
export interface OutputSize extends SizeOverrides {
  readonly name: string;
  readonly width: number;
  readonly height: number;
}

/**
 * A single colour stop in a gradient background.
 */
export interface GradientStop {
  /** Offset along the gradient, e.g. `"0%"` or `"55%"`. */
  readonly offset: string;
  readonly color: string;
}

/**
 * Background fill for an image: a flat colour or a linear gradient.
 *
 * Gradient coordinates use SVG object-bounding-box units (0–1); the default
 * runs diagonally from the top-left `(0, 0)` to the bottom-right `(1, 1)`.
 */
export type Background =
  | { readonly type: "solid"; readonly color: string }
  | {
      readonly type: "gradient";
      readonly stops: readonly GradientStop[];
      readonly from?: { readonly x: number; readonly y: number };
      readonly to?: { readonly x: number; readonly y: number };
    };

/**
 * Brand colours used to derive the default gradient and text colour. All are
 * configurable per project — nothing here is tied to a specific site.
 */
export interface BrandColors {
  readonly brand: string;
  /** Darker shade used at the start of the default gradient. */
  readonly brandDark?: string;
  /** Warmer shade used at the end of the default gradient. */
  readonly brandWarm?: string;
  /** Text/foreground colour. Defaults to white. */
  readonly foreground?: string;
}

/**
 * A small badge drawn in the corner of the `banner` template (e.g. an "npm"
 * chip). Set to `null` in config to omit it.
 */
export interface Badge {
  readonly text: string;
  /** Badge text colour. Defaults to the brand colour. */
  readonly color?: string;
  /** Badge background colour. Defaults to white. */
  readonly background?: string;
}

/**
 * Styling for the `code` template. Every field is optional; defaults are
 * applied by `resolveConfig`.
 */
export interface CodeStyle {
  /** Shiki theme name, e.g. `github-dark`, `monokai`, `catppuccin-mocha`. */
  readonly theme?: string;
  /**
   * Monospace font stack. Must resolve to a configured font, or to an
   * installed one when `systemFonts` is on.
   */
  readonly fontFamily?: string;
  /**
   * Glyph advance width as a fraction of the font size. `0.6` matches most
   * monospace faces (Source Code Pro, Menlo, DejaVu Sans Mono); narrower faces
   * such as Consolas want ~`0.55`.
   */
  readonly charWidthRatio?: number;
  /** Line advance as a multiple of the font size. Default `1.55`. */
  readonly lineHeight?: number;
  /** Spaces a tab expands to before layout. Default `2`. */
  readonly tabSize?: number;
  /** Corner radius of the code panel, as a fraction of the smaller side. */
  readonly cornerScale?: number;
  /** Upper bound on the auto-fitted font size, as a fraction of image width. */
  readonly maxFontScale?: number;
  /**
   * Lower bound on the auto-fitted font size, as a fraction of image width —
   * width, because that is what a feed scales a share image to. Code too long
   * to fit at this size is truncated with an ellipsis rather than shrunk into
   * illegibility, so raising this trades lines of code for readability and
   * lowering it does the reverse.
   */
  readonly minFontScale?: number;
}

/**
 * A font to load into the rasteriser, given either as a file path or as the
 * font's bytes. Supply one entry per font file: weight and style are read from
 * the file itself, so a bold and a regular face are two entries, and the SVG's
 * `font-weight` picks between them.
 *
 * `family` is optional and does not affect matching — the family name in the
 * font file does that. When given on the first font it seeds `fontFamily`,
 * which saves repeating the name for the common single-font case.
 */
export type FontSource =
  | {
      readonly family?: string;
      /**
       * Path to a `.ttf`, `.otf`, `.ttc` or `.otc` file, resolved from the
       * current working directory when relative.
       */
      readonly path: string;
    }
  | {
      readonly family?: string;
      /**
       * The font file's bytes, for fonts loaded from a bundle or fetched at
       * build time rather than read from disk.
       */
      readonly data: Uint8Array;
    };

/**
 * Image properties, typically read from a post's frontmatter. The schema is
 * intentionally open: templates read whatever fields they understand, so a
 * project can pass arbitrary extra props through.
 */
export interface MetaImageProps {
  /** Name of the template to render with. */
  readonly template: string;
  readonly title?: string;
  readonly subtitle?: string;
  readonly version?: string | number;
  readonly [key: string]: unknown;
}

/**
 * Build image props from a post's whole frontmatter, so a project can use the
 * fields it already has rather than adding a props block to every file.
 *
 * Return `undefined` to leave a post without images. That is the filter for
 * drafts, section indexes and anything else in the tree that is not a page
 * worth sharing — without it, mapping frontmatter would mean an image for every
 * markdown file there is. It only settles posts that say nothing for
 * themselves, though: one declaring a props block is rendered either way, since
 * asking for an image outright beats a blanket rule.
 *
 * The returned fields need not be complete: they are merged under whatever the
 * post declares explicitly, and a missing template falls back to
 * {@link ContentOptions.defaultTemplate}.
 */
export type PropsFromFrontmatter = (
  frontmatter: Record<string, unknown>,
) => Record<string, unknown> | undefined;

/**
 * How a post's slug — the base name for its images — is derived from its path
 * when the frontmatter does not declare one.
 *
 * - `basename`: the filename without extension, or the parent directory for
 *   `index.*`. Suits page bundles, where the image sits beside the content.
 * - `route`: the whole path without extension, with `index.*` standing for its
 *   directory, so `services/iam/index.md` becomes `services/iam` and a root
 *   `index.md` becomes `index`. Suits a site addressed by route.
 */
export type SlugStrategy = "basename" | "route";

/**
 * How to read image props out of a content tree. Every field is optional.
 *
 * This is the host-project half of the job — finding posts and understanding
 * their frontmatter — and is deliberately absent from {@link ResolvedConfig}:
 * a template is handed the resolved config, and where the props came from is
 * none of its business.
 */
export interface ContentOptions {
  /** Frontmatter key holding the image props object. Default `meta_img_props`. */
  readonly propsKey?: string;
  /** Field within the props object naming the template. Default `template`. */
  readonly templateField?: string;
  /** Template to use when the template field is absent. */
  readonly defaultTemplate?: string;
  /**
   * Derive props from a post's existing frontmatter, for a site whose posts
   * already carry the fields an image needs under different names. An explicit
   * props object still wins field by field, so per-post overrides keep working.
   */
  readonly props?: PropsFromFrontmatter;
  /**
   * Top-level frontmatter field to read the post slug from (used as the base
   * filename). Default `slug`; falls back to the file/directory name.
   */
  readonly slugField?: string;
  /**
   * How to derive a slug from a post's path when its frontmatter declares
   * none. Default `basename`.
   */
  readonly slugStrategy?: SlugStrategy;
  /** File extensions to include. Default `.md` and `.markdown`. */
  readonly extensions?: readonly string[];
}

/**
 * A discovered content file with the image props read from its frontmatter.
 *
 * It lives here rather than with the walker so that {@link Placement} can name
 * it without the config module depending on the content module, for the reason
 * {@link ContentOptions} does.
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
 * Where an image is written, and the URL it is served at once it is.
 *
 * `outputPath` alone says where the bytes go and nothing about how anyone
 * reaches them, so every site ends up rebuilding that mapping in its own
 * templates — from information Colophon had at generate time and threw away.
 *
 * - `beside-content`: next to the post, which is the page-bundle convention
 *   and what Colophon has always done. Still the default.
 * - `public-dir`: gathered into one directory, as Astro, Eleventy and Vite
 *   expect. A slug carrying directories keeps them underneath it.
 * - `custom`: for a site whose mapping is its own — images under a dated
 *   directory, say.
 *
 * `urlBase` is what makes a URL: it is prefixed to the image's path under the
 * root that placed it, and without one there is no URL, because no directory
 * on disk says by itself how it is served. It can be a site-relative path
 * (`/og`) or an absolute one, for images served from a CDN.
 *
 * `hash` puts a digest of the image's inputs in its filename, so that changing
 * a post gives its image a URL nobody has cached yet. It is opt-in because it
 * also means the filename moves whenever the image does, which not every setup
 * wants. `custom` has no say in it: a placement naming its own paths is the
 * one that can hash them itself.
 */
export type Placement =
  | {
      readonly strategy: "beside-content";
      readonly urlBase?: string;
      readonly hash?: boolean;
    }
  | {
      readonly strategy: "public-dir";
      /** Directory to gather images into, relative to the working directory. */
      readonly dir: string;
      readonly urlBase?: string;
      readonly hash?: boolean;
    }
  | {
      readonly strategy: "custom";
      readonly path: (file: ContentFile, size: OutputSize) => string;
      /** Omit for images that are written but not served. */
      readonly url?: (
        file: ContentFile,
        size: OutputSize,
      ) => string | undefined;
    };

/**
 * One image in the manifest.
 *
 * The dimensions are the ones it was actually rendered at, which is the point:
 * sites hardcode 1200 and 630 into their meta tags because nothing told them
 * otherwise, and a size they later change leaves the tags behind.
 */
export interface ManifestImage {
  /** Absent where the placement knows no URL — see {@link Placement}. */
  readonly url?: string;
  readonly width: number;
  readonly height: number;
}

/** One page's images, keyed by output size name. */
export interface ManifestPage {
  readonly images: Readonly<Record<string, ManifestImage>>;
  /**
   * The name of the most landscape image, by aspect ratio, with ties going to
   * the first size configured. It is what a `summary_large_image` card wants,
   * and picking it is a check every site currently writes for itself.
   */
  readonly widest: string;
  /** Alt text, from the props' title. Absent for a page that has no title. */
  readonly alt?: string;
}

/**
 * What a build generated, for the site to read back: a JSON file listing every
 * page's images, their URLs and the dimensions they were rendered at.
 *
 * Without it a site reconstructs all of that in template code — globbing for
 * `*-og.png` to find the landscape variant, or writing image paths back into
 * each post's frontmatter. All of it is known while generating.
 *
 * Pages are keyed by slug, which is what a site addresses a page by: with
 * `slugStrategy: "route"` that is the route itself.
 */
export interface Manifest {
  /** Schema version, so a reader can tell what it is holding. */
  readonly version: 1;
  readonly pages: Readonly<Record<string, ManifestPage>>;
}

/**
 * One `<meta>` tag, as the attributes it carries.
 *
 * Open Graph names its tags with `property` and Twitter with `name`, which is
 * a distinction sites get wrong routinely. Keeping them apart in the type
 * means a component can spread a tag — `<meta {...tag} />` — and be right
 * either way.
 */
export type MetaTag =
  | { readonly property: string; readonly content: string }
  | { readonly name: string; readonly content: string };

/** Options for {@link MetaTag} generation. */
export interface MetaTagOptions {
  /**
   * Absolute base for a site-relative image URL, e.g. `https://example.com`.
   *
   * Open Graph wants an absolute URL — a crawler has no page to resolve a
   * relative one against — and a manifest records whatever the placement's
   * `urlBase` said, which is usually site-relative. A URL that is already
   * absolute is left alone, so a CDN base needs nothing here.
   */
  readonly baseUrl?: string;
}

/**
 * Reports something a template had to compromise on — code truncated to stay
 * legible, so far. Rendering carries on regardless: a share image is worth
 * having even when the input did not quite fit, but the author should hear
 * about it rather than discover it in someone else's timeline.
 */
export type WarningHandler = (message: string) => void;

/**
 * Everything a template needs to produce its SVG foreground content.
 */
export interface TemplateContext {
  readonly props: MetaImageProps;
  readonly config: ResolvedConfig;
  readonly dimensions: Dimensions;
}

/**
 * A registered template. `render` returns the SVG *foreground* content (text,
 * badges, etc.) for the given dimensions; the background and the enclosing
 * `<svg>` root are added by the renderer.
 *
 * Rendering may be asynchronous — the `code` template loads syntax grammars on
 * demand — so `render` can return a promise. Simple templates can stay
 * synchronous and just return a string.
 */
export interface Template {
  readonly name: string;
  render(context: TemplateContext): string | Promise<string>;
}

/**
 * User-supplied configuration. Every field is optional; defaults are applied
 * by `resolveConfig`.
 */
export interface ColophonConfig {
  readonly colors?: BrandColors;
  /** Explicit background, overriding the gradient derived from `colors`. */
  readonly background?: Background;
  /**
   * Fonts to load into the rasteriser, so the output does not depend on what
   * the build machine happens to have installed. Supplying any font turns
   * {@link ColophonConfig.systemFonts} off by default, which is the point:
   * a laptop, CI and a Docker image then render the same image.
   */
  readonly fonts?: readonly FontSource[];
  /**
   * Whether to also load the machine's installed fonts. Defaults to `true`
   * when no `fonts` are configured (nothing else would render) and `false`
   * when they are. Turn it on alongside `fonts` to fall back to system fonts
   * for families you have not supplied — at the cost of determinism.
   */
  readonly systemFonts?: boolean;
  /**
   * Font stack for template text. Defaults to the `family` of the first
   * configured font, or to `DEFAULT_FONT_FAMILY` when there is none.
   */
  readonly fontFamily?: string;
  /** Footer text drawn along the bottom edge. Omit (the default) for none. */
  readonly footer?: string;
  /** Corner badge for the `banner` template. Omit (the default) for none. */
  readonly badge?: Badge;
  /** Styling for the `code` template. */
  readonly code?: CodeStyle;
  /**
   * Where non-fatal rendering complaints go. Defaults to `console.warn`; pass
   * a no-op to silence them, or your build's logger to route them.
   */
  readonly onWarning?: WarningHandler;
  /**
   * Output sizes, each with a unique `name` used in the filename. Defaults to
   * a 1.91:1 Open Graph landscape plus a 1:1 square (see `DEFAULT_SIZES`).
   */
  readonly sizes?: readonly OutputSize[];
  /** Extra templates, merged over (and able to override) the built-ins. */
  readonly templates?: Readonly<Record<string, Template>>;
  /**
   * How to read props out of the content tree. Used by `generate` and the CLI;
   * the render core never sees it.
   */
  readonly content?: ContentOptions;
  /**
   * Where images are written and what URL they end up at. Defaults to
   * `beside-content`, which is what Colophon did before there was a choice.
   */
  readonly placement?: Placement;
  /**
   * Where to write a {@link Manifest} of everything the build generated,
   * relative to the working directory. Omit (the default) to write none.
   *
   * Somewhere the site reads data from: `data/colophon.json` for Hugo,
   * `src/data/` for Astro, `_data/` for Eleventy and Jekyll.
   */
  readonly manifest?: string;
  /**
   * One-off images that belong to the project rather than to any post — a
   * package card, a repository social preview. Rendered by the same build, and
   * skipped or re-rendered on the same stamps.
   */
  readonly extra?: readonly ExtraImage[];
}

/**
 * Config an {@link OutputSize} may override for itself.
 *
 * Some settings only make sense per size: `code.minFontScale` is the clearest
 * case, because a 1:1 square and a 1.91:1 landscape have very different amounts
 * of vertical room for the same snippet. Without this the only way to vary one
 * is a `generate` pass per size, which walks and parses the whole content tree
 * again for each.
 *
 * Only what a template reads while drawing is overridable. `fonts`,
 * `systemFonts` and `templates` are shared build inputs rather than part of the
 * picture; `onWarning` is where messages go, not what they say; and `sizes`
 * inside a size would be nonsense.
 */
export interface SizeOverrides {
  /**
   * Merged over the config's `colors`, so a size can change one shade on its
   * own — `brand` is optional here precisely because the rest are kept.
   */
  readonly colors?: Partial<BrandColors>;
  /** Replaces the config's background outright — see the note on merging. */
  readonly background?: Background;
  readonly fontFamily?: string;
  readonly footer?: string;
  readonly badge?: Badge;
  /** Merged over the config's `code`, so a size can change one setting. */
  readonly code?: CodeStyle;
}

/**
 * A single image that is not tied to a content file: props, somewhere to write
 * it, and the size to draw it at.
 *
 * The alternative is a script that calls `renderMetaImages` and writes the
 * bytes itself, which is a lot of machinery for one card — and one that keeps
 * neither the rebuild stamps nor the build log a content image gets.
 */
export interface ExtraImage {
  readonly props: MetaImageProps;
  /**
   * Where to write the PNG, resolved from the current working directory when
   * relative. This image has no post to sit beside, so there is nothing to
   * derive a path from and `generate`'s `outputPath` is not consulted.
   */
  readonly output: string;
  /**
   * The size to render at, {@link SizeOverrides} and all — an inline size is
   * how a one-off image gets its own footer or palette without a whole entry
   * in `sizes`. Defaults to the first configured size, since a one-off card
   * usually wants to match the site's primary share format.
   */
  readonly size?: OutputSize;
}

/**
 * Fully-resolved configuration with all defaults applied.
 */
export interface ResolvedConfig {
  readonly colors: Required<BrandColors>;
  readonly background: Background;
  /** Configured fonts, with every `path` made absolute. */
  readonly fonts: readonly FontSource[];
  readonly systemFonts: boolean;
  readonly fontFamily: string;
  readonly footer: string | undefined;
  readonly badge: Badge | undefined;
  readonly code: Required<CodeStyle>;
  readonly onWarning: WarningHandler;
  readonly sizes: readonly OutputSize[];
  readonly templates: Readonly<Record<string, Template>>;
}

/**
 * One rendered image: the source SVG plus the encoded PNG bytes.
 */
export interface RenderedMetaImage {
  /** The name of the output size this image was rendered for. */
  readonly name: string;
  readonly dimensions: Dimensions;
  readonly svg: string;
  readonly png: Buffer;
}
