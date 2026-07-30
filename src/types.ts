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
 * A raster or SVG image to draw into a generated one, given either as a file
 * path or as its bytes. It mirrors {@link FontSource}, and for the same
 * reasons: a path is checked when the config is resolved rather than when the
 * image is drawn, and the bytes are what the rebuild stamp hashes, so replacing
 * a logo at the same path re-renders everything drawn with it.
 *
 * PNG, JPEG, GIF, WebP and SVG are understood. Text inside an SVG is not
 * rendered, because a nested document is drawn without the fonts the build
 * loaded; convert it to paths first, or use a raster image.
 */
export type ImageSource =
  | {
      /** Resolved from the working directory when relative. */
      readonly path: string;
    }
  | {
      /**
       * The image file's bytes. The format is read from them, so there is
       * nothing to declare and nothing to get wrong.
       */
      readonly data: Uint8Array;
    };

/** A wash of colour over a background image, so that text stays legible. */
export interface Scrim {
  /** Defaults to black. */
  readonly color?: string;
  /** Opacity at the top edge. Defaults to `0.25`. */
  readonly from?: number;
  /** Opacity at the bottom edge. Defaults to `0.65`. */
  readonly to?: number;
}

/**
 * One soft blob of colour in a mesh background.
 *
 * The position is in fractions of the image, so the same mesh describes the
 * same picture at every output size. The radius is a fraction of the longer
 * side, which keeps a blob covering as much of a landscape image as it does of
 * a square one.
 */
export interface MeshBlob {
  readonly color: string;
  /** Centre, across. Defaults to the middle. */
  readonly x?: number;
  /** Centre, down. Defaults to the middle. */
  readonly y?: number;
  /** Defaults to `0.7`. */
  readonly radius?: number;
  /** Opacity at the centre, fading to nothing at the edge. Defaults to `1`. */
  readonly opacity?: number;
}

/**
 * Background fill for an image: a flat colour, a linear gradient, a mesh of
 * soft colour, or a photo.
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
    }
  | {
      /**
       * Overlapping blobs of colour over a flat base, which is the look a
       * linear gradient cannot give: colour that moves in more than one
       * direction. Each blob is a radial fade, so nothing here is expensive to
       * draw.
       */
      readonly type: "mesh";
      /** The flat colour the blobs are laid over. */
      readonly color: string;
      readonly blobs: readonly MeshBlob[];
    }
  | {
      readonly type: "image";
      readonly source: ImageSource;
      /**
       * `cover` fills the image and crops the overflow, which is what a photo
       * behind a headline wants. `contain` fits the whole picture in and shows
       * `color` in what is left over.
       */
      readonly fit?: "cover" | "contain";
      /** Behind the image, and either side of a `contain` fit. */
      readonly color?: string;
      /**
       * Defaults to a gentle shade towards the bottom. A photograph is light
       * and dark wherever it likes, and white text over a bright sky cannot be
       * read, so this is what makes the difference between a designed image and
       * text sitting on a picture. Set `{ from: 0, to: 0 }` for none: `from`
       * has a default of its own, so naming only `to` leaves the top shaded.
       */
      readonly scrim?: Scrim;
    };

/**
 * A treatment laid over the background, under everything a template draws.
 *
 * A flat fill or a gradient is clean but a little bare, and these are the
 * cheap ways to give one some surface: film grain, a dot grid, or ruled
 * lines. All three are a few elements of SVG rather than an image to load,
 * and all three are meant to be felt rather than seen, so the defaults are
 * faint.
 *
 * Lengths are in pixels at the size being rendered, so a texture is a little
 * finer on a large image than on a small one, which is what keeps a dot grid
 * looking like the same grid across a set of sizes.
 */
export type Texture =
  | {
      /**
       * Film grain, from one turbulence filter. It lightens what is under it
       * slightly, since the noise it lays down is grey.
       */
      readonly type: "grain";
      /** Defaults to `0.1`. */
      readonly opacity?: number;
      /** Roughly the size of a speck, in pixels. Defaults to `1.4`. */
      readonly scale?: number;
    }
  | {
      readonly type: "dots";
      /** Defaults to the foreground colour. */
      readonly color?: string;
      /** Defaults to `0.08`. */
      readonly opacity?: number;
      /** Dot diameter. Defaults to `5`. */
      readonly size?: number;
      /** Centre-to-centre spacing. Defaults to `44`. */
      readonly gap?: number;
    }
  | {
      readonly type: "rules";
      /** Defaults to the foreground colour. */
      readonly color?: string;
      /** Defaults to `0.06`. */
      readonly opacity?: number;
      /** Line thickness. Defaults to `2`. */
      readonly width?: number;
      /** Spacing between lines. Defaults to `28`. */
      readonly gap?: number;
      /** Degrees clockwise from vertical. Defaults to `45`. */
      readonly angle?: number;
    };

/**
 * A named preset: a palette, a background and, for some of them, a texture.
 *
 * Choosing colours from nothing is the step that stops someone trying a
 * package, and a theme is the answer to it. Everything a theme sets is an
 * ordinary config default, so naming `colors` or `background` alongside one
 * keeps that field and takes the rest of the look.
 */
export type ThemeName =
  | "midnight"
  | "aurora"
  | "ember"
  | "forest"
  | "bloom"
  | "slate"
  | "paper"
  | "sandstone";

/**
 * An image that has been loaded and is ready to draw: the `data:` URI a
 * template hands to `image`, and the shape of the picture behind it.
 */
export interface ImageAsset {
  readonly href: string;
  /**
   * Width divided by height. `1` where the format is one whose dimensions
   * cannot be read, so a template reserves a square and the picture sits
   * inside it rather than being stretched.
   */
  readonly aspect: number;
}

/**
 * Brand colours used to derive the default gradient and text colour. All are
 * configurable per project, and nothing here is tied to a specific site.
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
  /** Line advance as a multiple of the font size. Default `1.55`. */
  readonly lineHeight?: number;
  /** Spaces a tab expands to before layout. Default `2`. */
  readonly tabSize?: number;
  /** Corner radius of the code panel, as a fraction of the smaller side. */
  readonly cornerScale?: number;
  /** Upper bound on the auto-fitted font size, as a fraction of image width. */
  readonly maxFontScale?: number;
  /**
   * Lower bound on the auto-fitted font size, as a fraction of image width.
   * Width, because that is what a feed scales a share image to. Code too long
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
 * `family` is optional and does not affect matching, since the family name in
 * the font file does that. When given on the first font it seeds `fontFamily`,
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
  /**
   * An author photo, as a path to an image file or its `data:` URI. Named here
   * with the other well-known props because the renderer has to load it before
   * a template can draw it, which it cannot do for a prop it does not know.
   */
  readonly avatar?: string;
  /**
   * Corner badge for the `banner` template, overriding whatever the config or
   * the size sets. `false` draws none, which is how one post opts out of a
   * site-wide badge that does not describe it.
   */
  readonly badge?: Badge | false;
  readonly [key: string]: unknown;
}

/**
 * Build image props from a post's whole frontmatter, so a project can use the
 * fields it already has rather than adding a props block to every file.
 *
 * Return `undefined` to leave a post without images. That is the filter for
 * drafts, section indexes and anything else in the tree that is not a page
 * worth sharing. Without it, mapping frontmatter would mean an image for every
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
 * How a post's slug, the base name for its images, is derived from its path
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
 * This is the host-project half of the job, finding posts and understanding
 * their frontmatter. It is deliberately absent from {@link ResolvedConfig},
 * which is what a template is handed, and where the props came from is none of
 * a template's business.
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
 * templates, from information Colophon had at generate time and threw away.
 *
 * - `beside-content`: next to the post, which is the page-bundle convention
 *   and what Colophon has always done. Still the default.
 * - `public-dir`: gathered into one directory, as Astro, Eleventy and Vite
 *   expect. A slug carrying directories keeps them underneath it.
 * - `custom`: for a site whose mapping is its own, such as images under a
 *   dated directory.
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
  /** Absent where the placement knows no URL. See {@link Placement}. */
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
 * Without it a site reconstructs all of that in template code, globbing for
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
 * means a component can spread a tag with `<meta {...tag} />` and be right
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
   * Open Graph wants an absolute URL, since a crawler has no page to resolve a
   * relative one against. A manifest records whatever the placement's
   * `urlBase` said, which is usually site-relative. A URL that is already
   * absolute is left alone, so a CDN base needs nothing here.
   */
  readonly baseUrl?: string;
}

/**
 * Reports something a template had to compromise on, so far only code
 * truncated to stay legible. Rendering carries on regardless, since a share
 * image is worth having even when the input did not quite fit, but the author
 * should hear about it rather than discover it in someone else's timeline.
 */
export type WarningHandler = (message: string) => void;

/**
 * How a run of text is drawn, as far as its width is concerned. Style that
 * cannot move a glyph's advance, such as colour, is not here.
 */
export interface TextStyle {
  /** CSS-style stack, matched against the configured fonts in order. */
  readonly fontFamily: string;
  readonly fontSize: number;
  /** Defaults to `400`. The nearest weight in the family is measured. */
  readonly fontWeight?: number;
  /**
   * Advance width to assume, as a fraction of the font size, when no
   * configured font matches the stack and the width has to be guessed.
   *
   * The default suits proportional text. A caller drawing monospace passes its
   * own, because the same guess would be far too narrow for a face whose every
   * glyph is as wide as an `M`.
   */
  readonly fallbackRatio?: number;
}

/**
 * The width, in pixels, that `text` occupies when drawn in `style`.
 *
 * Exact where the style resolves to a font the build loaded, since then the
 * glyph advances are read from the file the rasteriser is drawing with.
 * Estimated otherwise, which is the best there is when the text will be drawn
 * in whichever font the machine happens to have.
 */
export type MeasureText = (text: string, style: TextStyle) => number;

/**
 * Everything a template needs to produce its SVG foreground content.
 */
export interface TemplateContext {
  readonly props: MetaImageProps;
  readonly config: ResolvedConfig;
  readonly dimensions: Dimensions;
  /**
   * Measures text in the fonts this build is rendering with, so a template can
   * wrap and fit its text to the space it has rather than guessing.
   */
  readonly measure: MeasureText;
  /**
   * The configured logo, loaded and ready to draw, or `undefined` where there
   * is none. Reading the file is the renderer's job rather than the template's,
   * so that a template stays a synchronous function over values it was handed.
   *
   * Present and possibly undefined, as `footer` and `badge` are on a resolved
   * config: a context is built once and handed over whole, and a field that is
   * sometimes absent makes every construction of one a conditional.
   */
  readonly logo: ImageAsset | undefined;
  /** The same for a post's `avatar` prop. */
  readonly avatar: ImageAsset | undefined;
}

/**
 * A registered template. `render` returns the SVG *foreground* content (text,
 * badges, etc.) for the given dimensions; the background and the enclosing
 * `<svg>` root are added by the renderer.
 *
 * Rendering may be asynchronous, since the `code` template loads syntax
 * grammars on demand, so `render` can return a promise. Simple templates can
 * stay synchronous and just return a string.
 */
export interface Template {
  readonly name: string;
  render(context: TemplateContext): string | Promise<string>;
}

/**
 * Turns one finished SVG document into PNG bytes.
 *
 * The default is resvg, which is what makes the output reproducible: it takes
 * explicit font files and can be told to ignore the ones the machine has
 * installed. The seam is here for the backends it is not, such as a wasm build
 * of the same renderer, which would let a build run at the edge or in a
 * browser, or another rasteriser entirely for a project that has one.
 *
 * PNG, though, and not a way to other formats yet. `generate` and
 * `colophon preview` record a rebuild stamp in each image they write, as a PNG
 * `tEXt` chunk, so bytes that cannot be stamped cannot be written and a WebP or
 * AVIF backend fails with `Cannot stamp: not a PNG image`. `renderMetaImages`
 * hands its bytes straight back and stamps nothing, so it will return whatever
 * a backend produces; a project going that way is writing the files itself and
 * giving up the rebuild skip along with them.
 *
 * A rasteriser is handed the whole resolved config rather than an argument list
 * of the parts of it that matter, as a template is, because which parts matter
 * is the backend's business: `fonts` may hold bytes or paths, `systemFonts`
 * says whether to look further, and `fontFamily` is what to fall back to.
 * {@link Dimensions} is the size to produce; the SVG carries the same
 * proportions, so a backend that only scales by width will land on it anyway.
 *
 * It returns a `Uint8Array` rather than a `Buffer`, because `Buffer` is Node's
 * and the point of the seam is the backends that are not: a wasm renderer in a
 * browser or a worker hands back a `Uint8Array` and has no `Buffer` to convert
 * it to. A `Buffer` is one, so a Node backend needs no change; the one place
 * that wants the extra methods converts on the way out.
 */
export type Rasteriser = (
  svg: string,
  dimensions: Dimensions,
  config: ResolvedConfig,
) => Uint8Array | Promise<Uint8Array>;

/**
 * User-supplied configuration. Every field is optional; defaults are applied
 * by `resolveConfig`.
 */
export interface ColophonConfig {
  /**
   * A named look to start from: see {@link ThemeName}. A theme supplies
   * `colors`, `background` and sometimes `texture`, and any of those the
   * config sets for itself wins.
   */
  readonly theme?: ThemeName;
  readonly colors?: BrandColors;
  /** Explicit background, overriding the gradient derived from `colors`. */
  readonly background?: Background;
  /**
   * A treatment over the background: grain, a dot grid or ruled lines. Omit
   * (the default) for none, unless a theme brings one.
   */
  readonly texture?: Texture;
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
   * for families you have not supplied, at the cost of determinism.
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
  /**
   * A logo to draw in the corner, which is most of what branding an image
   * means. Where it goes is the template's business; how big it is comes from
   * the image's own proportions and the size being drawn.
   */
  readonly logo?: ImageSource;
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
   * What turns each finished SVG into PNG bytes. Defaults to resvg, which is
   * what the package renders with and what its font handling is built around.
   * See {@link Rasteriser} for when a project would want another, and for why
   * it still has to be PNG.
   */
  readonly rasteriser?: Rasteriser;
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
   * One-off images that belong to the project rather than to any post, such as
   * a package card or a repository social preview. Rendered by the same build,
   * and skipped or re-rendered on the same stamps.
   */
  readonly extra?: readonly ExtraImage[];
}

/**
 * A function a config module may export instead of a config object, so that a
 * config which has to compute something, such as brand colours read out of the
 * site's own stylesheet, can still be a config module rather than a script.
 *
 * It takes no arguments. Anything it might be handed is either already on the
 * command line or a decision the config itself is making.
 */
export type ColophonConfigFactory = () =>
  ColophonConfig | Promise<ColophonConfig>;

/** What a config module's default export may be. */
export type ColophonConfigInput = ColophonConfig | ColophonConfigFactory;

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
 * picture. `onWarning` is where messages go rather than what they say, and
 * `sizes` inside a size would be nonsense.
 */
export interface SizeOverrides {
  /**
   * Replaces the config's theme, for a size that wants a different look.
   * Whatever the config names for itself still wins over it, exactly as it
   * does over the config's own theme.
   */
  readonly theme?: ThemeName;
  /**
   * Merged over the config's `colors`, or over the theme's where the config
   * names none, so a size can change one shade on its own. `brand` is optional
   * here precisely because the rest are kept.
   */
  readonly colors?: Partial<BrandColors>;
  /** Replaces the config's background outright. See the note on merging. */
  readonly background?: Background;
  /** Replaces the config's texture. */
  readonly texture?: Texture;
  readonly fontFamily?: string;
  readonly footer?: string;
  readonly badge?: Badge;
  /** Replaces the config's logo, for a size that wants a different mark. */
  readonly logo?: ImageSource;
  /** Merged over the config's `code`, so a size can change one setting. */
  readonly code?: CodeStyle;
}

/**
 * A single image that is not tied to a content file: props, somewhere to write
 * it, and the size to draw it at.
 *
 * The alternative is a script that calls `renderMetaImages` and writes the
 * bytes itself, which is a lot of machinery for one card, and which keeps
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
   * The size to render at, {@link SizeOverrides} and all. An inline size is
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
  /**
   * The texture over the background, with any colour it left open filled in
   * from the palette. There is no theme here: a theme is a set of defaults for
   * these fields, and by this point they have been applied.
   */
  readonly texture: Texture | undefined;
  /** Configured fonts, with every `path` made absolute. */
  readonly fonts: readonly FontSource[];
  readonly systemFonts: boolean;
  readonly fontFamily: string;
  readonly footer: string | undefined;
  readonly badge: Badge | undefined;
  readonly logo: ImageSource | undefined;
  readonly code: Required<CodeStyle>;
  readonly onWarning: WarningHandler;
  readonly sizes: readonly OutputSize[];
  readonly templates: Readonly<Record<string, Template>>;
  readonly rasteriser: Rasteriser;
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
