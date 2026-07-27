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
  /** File extensions to include. Default `.md` and `.markdown`. */
  readonly extensions?: readonly string[];
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
