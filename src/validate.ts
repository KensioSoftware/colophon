import type {
  Background,
  Badge,
  BrandColors,
  CodeStyle,
  ColophonConfig,
  ContentOptions,
  FontSource,
  GradientStop,
  OutputSize,
} from "./types.js";

/**
 * The keys of one config object, as a list to check incoming keys against.
 *
 * Taking a `Record<keyof T, true>` rather than a plain array of strings is
 * what keeps the list honest: adding an option to `types.ts` without listing
 * it here fails the build, which is much better than the new option quietly
 * becoming an unknown one.
 */
function knownKeys<T>(shape: Record<keyof T, true>): readonly string[] {
  return Object.keys(shape);
}

type SolidBackground = Extract<Background, { readonly type: "solid" }>;
type GradientBackground = Extract<Background, { readonly type: "gradient" }>;
type GradientPoint = NonNullable<GradientBackground["from"]>;
type FontByPath = Extract<FontSource, { readonly path: string }>;
type FontByData = Extract<FontSource, { readonly data: Uint8Array }>;

const configKeys = knownKeys<ColophonConfig>({
  colors: true,
  background: true,
  fonts: true,
  systemFonts: true,
  fontFamily: true,
  footer: true,
  badge: true,
  code: true,
  onWarning: true,
  sizes: true,
  templates: true,
  content: true,
});

const contentKeys = knownKeys<ContentOptions>({
  propsKey: true,
  templateField: true,
  defaultTemplate: true,
  props: true,
  slugField: true,
  extensions: true,
});

const colorKeys = knownKeys<BrandColors>({
  brand: true,
  brandDark: true,
  brandWarm: true,
  foreground: true,
});

const badgeKeys = knownKeys<Badge>({
  text: true,
  color: true,
  background: true,
});

const codeKeys = knownKeys<CodeStyle>({
  theme: true,
  fontFamily: true,
  charWidthRatio: true,
  lineHeight: true,
  tabSize: true,
  cornerScale: true,
  maxFontScale: true,
  minFontScale: true,
});

const sizeKeys = knownKeys<OutputSize>({
  name: true,
  width: true,
  height: true,
  colors: true,
  background: true,
  fontFamily: true,
  footer: true,
  badge: true,
  code: true,
});

/**
 * Both font variants at once. Which of `path` and `data` a font may carry is
 * `fonts.ts`'s ruling to make, and it has a better message for it than a list
 * of keys could.
 */
const fontKeys = [
  ...new Set([
    ...knownKeys<FontByPath>({ family: true, path: true }),
    ...knownKeys<FontByData>({ family: true, data: true }),
  ]),
];

const solidBackgroundKeys = knownKeys<SolidBackground>({
  type: true,
  color: true,
});

const gradientBackgroundKeys = knownKeys<GradientBackground>({
  type: true,
  stops: true,
  from: true,
  to: true,
});

const gradientStopKeys = knownKeys<GradientStop>({
  offset: true,
  color: true,
});

const gradientPointKeys = knownKeys<GradientPoint>({ x: true, y: true });

/**
 * The background variants, as values to check a declared `type` against. Typed
 * against the union for the same reason the key lists are: a variant added to
 * `Background` and not listed here would otherwise be reported as an unknown
 * type, rejecting a config that is perfectly valid.
 */
const backgroundTypes = knownKeys<Record<Background["type"], unknown>>({
  solid: true,
  gradient: true,
});

/**
 * Options that have been renamed, keyed by where the old name turns up.
 * Edit distance cannot connect a rename that changed the word — `dimensions`
 * became `sizes` — and a config carried over from an older version is exactly
 * where a bare "unknown option" helps least.
 */
const renamedOptions = new Map<string, string>([["dimensions", "sizes"]]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isList(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

/**
 * Levenshtein distance between two strings, used to work out which option a
 * typo was aiming at. Both strings are option names and the lists are a
 * handful of entries long, so the plain two-row dynamic program is ample.
 */
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let row = 1; row <= a.length; row += 1) {
    const current = [row];

    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      // Every index here is within the row by construction; the fallbacks are
      // there for `noUncheckedIndexedAccess` rather than for any real case.
      current.push(
        Math.min(
          (previous[column - 1] ?? 0) + cost,
          (previous[column] ?? 0) + 1,
          (current[column - 1] ?? 0) + 1,
        ),
      );
    }

    previous = current;
  }

  return previous[b.length] ?? 0;
}

/**
 * The known name a mistyped one was most likely meant to be, or `undefined`
 * when nothing is close enough. A confident suggestion of something unrelated
 * is worse than none, so the tolerance stays under the length of the name:
 * a slip of a key or two earns a suggestion, a different word does not.
 */
function nearestName(
  name: string,
  known: readonly string[],
): string | undefined {
  const tolerance = Math.min(
    name.length - 1,
    Math.max(2, Math.ceil(name.length / 4)),
  );
  let nearest: string | undefined;
  let shortest = Infinity;

  for (const candidate of known) {
    // Case-insensitive: `tabsize` for `tabSize` is the same slip as a typo.
    const distance = editDistance(name.toLowerCase(), candidate.toLowerCase());

    if (distance < shortest) {
      nearest = candidate;
      shortest = distance;
    }
  }

  return shortest <= tolerance ? nearest : undefined;
}

function describeUnknownOption(
  path: string,
  key: string,
  known: readonly string[],
): string {
  const suggestion = renamedOptions.get(path) ?? nearestName(key, known);

  if (suggestion !== undefined) {
    return `Unknown option "${path}". Did you mean "${suggestion}"?`;
  }

  return `Unknown option "${path}". Valid options here: ${known.join(", ")}.`;
}

/**
 * Report every key of one config object that is not a known option. Anything
 * that is not an object is left alone: the shape of a value is the type
 * checker's business, and there are no keys to judge either way.
 */
function checkKeys(
  value: unknown,
  path: string,
  known: readonly string[],
  problems: string[],
): void {
  if (!isRecord(value)) {
    return;
  }

  for (const key of Object.keys(value)) {
    if (!known.includes(key)) {
      problems.push(
        describeUnknownOption(path === "" ? key : `${path}.${key}`, key, known),
      );
    }
  }
}

/** Check every entry of a list, naming each by its index. */
function checkEach(
  values: unknown,
  path: string,
  known: readonly string[],
  problems: string[],
): void {
  if (!isList(values)) {
    return;
  }

  for (const [index, value] of values.entries()) {
    checkKeys(value, `${path}[${String(index)}]`, known, problems);
  }
}

/**
 * Check a background against the keys of whichever variant it declares.
 *
 * A misspelt `type` is worth reporting on its own: `backgroundSvg` treats
 * anything that is not `solid` as a gradient, so `gradiant` silently becomes
 * one and then falls over on the stops it does not have. A background with no
 * `type` at all is left alone — the type is what says which keys apply, and
 * guessing would report the keys rather than the omission.
 */
function checkBackground(
  background: unknown,
  path: string,
  problems: string[],
): void {
  if (!isRecord(background)) {
    return;
  }

  const { type, stops, from, to } = background;

  if (type === "solid") {
    checkKeys(background, path, solidBackgroundKeys, problems);
    return;
  }

  if (type === "gradient") {
    checkKeys(background, path, gradientBackgroundKeys, problems);
    checkEach(stops, `${path}.stops`, gradientStopKeys, problems);
    checkKeys(from, `${path}.from`, gradientPointKeys, problems);
    checkKeys(to, `${path}.to`, gradientPointKeys, problems);
    return;
  }

  if (typeof type === "string") {
    const suggestion = nearestName(type, backgroundTypes);

    problems.push(
      suggestion === undefined
        ? `Unknown background type "${type}". Valid types: ${backgroundTypes.join(", ")}.`
        : `Unknown background type "${type}". Did you mean "${suggestion}"?`,
    );
  }
}

/**
 * Check each output size, and the overrides it carries.
 *
 * A size is the one place the same option names appear twice over, so the paths
 * matter more here than anywhere else: `sizes[1].code.minFontScal` has to say
 * which size it is talking about to be worth reading at all.
 */
function checkSizes(sizes: unknown, problems: string[]): void {
  if (!isList(sizes)) {
    return;
  }

  for (const [index, size] of sizes.entries()) {
    const path = `sizes[${String(index)}]`;
    checkKeys(size, path, sizeKeys, problems);

    if (!isRecord(size)) {
      continue;
    }

    checkKeys(size["colors"], `${path}.colors`, colorKeys, problems);
    checkKeys(size["badge"], `${path}.badge`, badgeKeys, problems);
    checkKeys(size["code"], `${path}.code`, codeKeys, problems);
    checkBackground(size["background"], `${path}.background`, problems);
  }
}

/**
 * Reject a config carrying options Colophon does not know.
 *
 * An unrecognised key is otherwise ignored in silence: the build succeeds, the
 * option does nothing, and the images come out with the defaults in its place.
 * That is at its worst across an upgrade, where a config that still reads
 * correctly is describing images nobody is rendering.
 *
 * Only the closed parts of the config are checked. The names in `templates`
 * are the project's own, and a post's props are open by design — a template
 * reads whatever fields it understands.
 */
export function validateConfig(config: ColophonConfig): void {
  // The types say what should be here; validation exists for when it is not.
  const raw = config as {
    readonly colors?: unknown;
    readonly content?: unknown;
    readonly background?: unknown;
    readonly badge?: unknown;
    readonly code?: unknown;
    readonly sizes?: unknown;
    readonly fonts?: unknown;
  };
  const problems: string[] = [];

  checkKeys(config, "", configKeys, problems);
  checkKeys(raw.colors, "colors", colorKeys, problems);
  checkKeys(raw.badge, "badge", badgeKeys, problems);
  checkKeys(raw.code, "code", codeKeys, problems);
  checkKeys(raw.content, "content", contentKeys, problems);
  checkSizes(raw.sizes, problems);
  checkEach(raw.fonts, "fonts", fontKeys, problems);
  checkBackground(raw.background, "background", problems);

  const [first, ...rest] = problems;

  if (first === undefined) {
    return;
  }

  throw new Error(
    rest.length === 0
      ? first
      : `Invalid config:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`,
  );
}
