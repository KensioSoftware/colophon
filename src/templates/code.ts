import type { CodeToken, HighlightedCode } from "../highlight.js";
import { highlightCode } from "../highlight.js";
import { escapeXml, textElement } from "../text.js";
import type { Dimensions, ResolvedConfig, Template } from "../types.js";
import { optionalString } from "./props.js";

/** Fraction of the font size the baseline sits below the glyph box top. */
const ascentRatio = 0.78;
const ellipsis = "…";

interface Panel {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
}

/**
 * Place the code panel within the image, leaving room above for a title and
 * below for a footer when either is present.
 */
function layoutPanel(
  dimensions: Dimensions,
  config: ResolvedConfig,
  titleFontSize: number,
  footerFontSize: number,
  hasTitle: boolean,
  hasFooter: boolean,
): Panel {
  const { width, height } = dimensions;
  const shorter = Math.min(width, height);
  const pad = Math.round(shorter * 0.05);
  const gap = Math.round(shorter * 0.028);

  const top = pad + (hasTitle ? titleFontSize + gap : 0);
  const bottom = height - pad - (hasFooter ? footerFontSize + gap : 0);

  return {
    x: pad,
    y: top,
    width: width - pad * 2,
    height: Math.max(1, bottom - top),
    radius: Math.round(shorter * config.code.cornerScale),
  };
}

/**
 * Shrink a panel onto its content, keeping it centred in the space it was
 * allotted. Both axes are floored so a small snippet still gets a panel with
 * presence rather than a letterbox slot or a narrow strip.
 */
function hugPanel(
  available: Panel,
  wanted: { readonly width: number; readonly height: number },
): Panel {
  const width = Math.min(
    available.width,
    Math.max(Math.round(wanted.width), Math.round(available.width * 0.55)),
  );
  // Floor relative to the panel's own width, so shrinking never leaves a
  // sliver, and never taller than the space the font was fitted against.
  const height = Math.min(
    available.height,
    Math.max(Math.round(wanted.height), Math.round(width * 0.25)),
  );

  return {
    ...available,
    x: available.x + Math.round((available.width - width) / 2),
    y: available.y + Math.round((available.height - height) / 2),
    width,
    height,
  };
}

/**
 * Pick the largest font size that fits the snippet in the panel on both axes,
 * clamped to the configured bounds.
 *
 * The bounds are fractions of the image *width*, not its height: a share image
 * is scaled to fit the width of whatever feed shows it, so width is what
 * decides whether the code ends up legible. Keying the floor to height would
 * let a landscape image render the same snippet at half the size of its square
 * counterpart.
 */
function fitFontSize(
  highlighted: HighlightedCode,
  codeWidth: number,
  codeHeight: number,
  imageWidth: number,
  config: ResolvedConfig,
): number {
  const { charWidthRatio, lineHeight, maxFontScale, minFontScale } =
    config.code;

  const byWidth =
    codeWidth / (Math.max(1, highlighted.longestLine) * charWidthRatio);
  const byHeight =
    codeHeight / (Math.max(1, highlighted.lines.length) * lineHeight);

  const fitted = Math.min(byWidth, byHeight, imageWidth * maxFontScale);
  return Math.max(1, Math.floor(Math.max(fitted, imageWidth * minFontScale)));
}

/**
 * Width of the laid-out block in characters, measured from the lines actually
 * being drawn. Narrower than the snippet's longest line whenever that line was
 * dropped or clipped, which keeps the panel hugged tight to what is visible.
 */
function blockColumns(lines: readonly (readonly CodeToken[])[]): number {
  let columns = 0;

  for (const tokens of lines) {
    const last = tokens.at(-1);

    if (last !== undefined) {
      columns = Math.max(columns, last.column + last.text.length);
    }
  }

  return columns;
}

function ellipsisToken(column: number): CodeToken {
  return {
    text: ellipsis,
    column,
    color: undefined,
    opacity: 0.6,
    bold: false,
    italic: false,
  };
}

/**
 * Drop lines that cannot fit at the chosen font size, marking the truncation
 * with an ellipsis line so the image never silently misrepresents the snippet.
 * The marker takes the indentation of the first dropped line, so it reads as
 * part of the block rather than as a stray mark in the left margin.
 */
function fitLines(
  lines: readonly (readonly CodeToken[])[],
  codeHeight: number,
  step: number,
): readonly (readonly CodeToken[])[] {
  const maxLines = Math.max(1, Math.floor(codeHeight / step));

  if (lines.length <= maxLines) {
    return lines;
  }

  const kept = lines.slice(0, maxLines - 1);
  const dropped = lines.slice(maxLines - 1).find((line) => line.length > 0);

  return [...kept, [ellipsisToken(dropped?.[0]?.column ?? 0)]];
}

/**
 * Clip a line to the columns that fit, ending it with an ellipsis. The font
 * size is floored for legibility, so a wide enough snippet can still overrun
 * the panel — clipping keeps it inside instead of bleeding off the image.
 *
 * Returns the line unchanged when it already fits, so the caller can count the
 * clipped lines by identity.
 */
function clipLine(
  tokens: readonly CodeToken[],
  maxColumns: number,
): readonly CodeToken[] {
  const last = tokens.at(-1);

  if (last === undefined || last.column + last.text.length <= maxColumns) {
    return tokens;
  }

  const clipped: CodeToken[] = [];

  for (const token of tokens) {
    if (token.column >= maxColumns) {
      break;
    }

    const room = maxColumns - token.column;

    if (token.text.length <= room) {
      clipped.push(token);
      continue;
    }

    clipped.push({ ...token, text: token.text.slice(0, room - 1) + ellipsis });
    break;
  }

  return clipped;
}

function plural(count: number, noun: string): string {
  return `${String(count)} ${noun}${count === 1 ? "" : "s"}`;
}

/**
 * Tell the author when the snippet did not fit. Nothing in a finished image
 * says the sample continued, so silent truncation is how a half-a-function
 * share card ends up on someone else's timeline.
 */
function warnIfTruncated(
  config: ResolvedConfig,
  dimensions: Dimensions,
  counts: { readonly dropped: number; readonly clipped: number },
  total: number,
): void {
  const parts: string[] = [];

  if (counts.dropped > 0) {
    parts.push(`${String(counts.dropped)} of ${plural(total, "line")} dropped`);
  }

  if (counts.clipped > 0) {
    parts.push(`${plural(counts.clipped, "line")} clipped to the panel width`);
  }

  if (parts.length === 0) {
    return;
  }

  config.onWarning(
    `code snippet does not fit the ${String(dimensions.width)}x${String(dimensions.height)}` +
      ` image at a legible size: ${parts.join(", ")}.` +
      ` Shorten the sample, or lower code.minFontScale to fit it in smaller.`,
  );
}

function tokenSpan(
  token: CodeToken,
  x: number,
  charWidth: number,
  foreground: string,
): string {
  const fill = token.color ?? foreground;
  const opacity =
    token.opacity === undefined
      ? ""
      : ` fill-opacity="${String(token.opacity)}"`;
  const weight = token.bold ? ` font-weight="700"` : "";
  const style = token.italic ? ` font-style="italic"` : "";

  return (
    `<tspan x="${String(Math.round(x + token.column * charWidth))}"` +
    ` fill="${fill}"${opacity}${weight}${style}>` +
    `${escapeXml(token.text)}</tspan>`
  );
}

/**
 * Syntax-highlighted code snippet on a rounded panel over the configured
 * background. Reads `code` and `language` from the props (as the original
 * `image_text` / `image_lexer` frontmatter did), with an optional `title`
 * above the panel and the configured footer below it.
 *
 * Highlighting uses Shiki, so token colours come from a real VS Code theme
 * rather than being approximated.
 */
export const codeTemplate: Template = {
  name: "code",
  async render({ props, config, dimensions }): Promise<string> {
    const { width, height } = dimensions;
    const code = optionalString(props["code"]) ?? "";
    const language = optionalString(props["language"]) ?? "text";
    const theme = optionalString(props["theme"]) ?? config.code.theme;

    const highlighted = await highlightCode(code, {
      language,
      theme,
      tabSize: config.code.tabSize,
    });

    const title = optionalString(props.title);
    const hasTitle = title !== undefined && title !== "";
    const hasFooter = config.footer !== undefined && config.footer !== "";

    const titleFs = Math.round(height * 0.045);
    const footerFs = Math.round(height * 0.032);
    const available = layoutPanel(
      dimensions,
      config,
      titleFs,
      footerFs,
      hasTitle,
      hasFooter,
    );

    const inner = Math.round(
      Math.min(available.width, available.height) * 0.07,
    );
    const codeWidth = Math.max(1, available.width - inner * 2);
    const codeHeight = Math.max(1, available.height - inner * 2);

    const fontSize = fitFontSize(
      highlighted,
      codeWidth,
      codeHeight,
      width,
      config,
    );
    const charWidth = fontSize * config.code.charWidthRatio;
    const step = fontSize * config.code.lineHeight;
    const maxColumns = Math.max(1, Math.floor(codeWidth / charWidth));
    const fitted = fitLines(highlighted.lines, codeHeight, step);
    let clipped = 0;

    const lines = fitted.map((tokens) => {
      const line = clipLine(tokens, maxColumns);

      if (line !== tokens) {
        clipped += 1;
      }

      return line;
    });

    warnIfTruncated(
      config,
      dimensions,
      { dropped: highlighted.lines.length - lines.length, clipped },
      highlighted.lines.length,
    );

    // Padding reads best proportional to the text, not the panel — a snippet
    // fitted down to a small size wants tighter margins. Only ever shrink, so
    // the code area the font was fitted against stays valid.
    const padding = Math.max(
      Math.min(inner, Math.round(fontSize * 1.6)),
      Math.round(inner * 0.35),
    );

    // Shrink the panel down onto the snippet so it isn't left floating in dead
    // space — on a landscape image especially, a wide panel holding a narrow
    // block leaves the code marooned off to one side.
    const blockWidth = blockColumns(lines) * charWidth;
    const panel = hugPanel(available, {
      width: blockWidth + padding * 2,
      height: lines.length * step + padding * 2,
    });

    // Code reads from the left edge, as it does in an editor. Indentation is
    // carried by each token's column, so the snippet keeps its shape.
    const originX = panel.x + padding;
    const originY = panel.y + (panel.height - lines.length * step) / 2;

    const shadowOffset = Math.max(
      1,
      Math.round(Math.min(width, height) * 0.01),
    );
    const shadow =
      `<rect x="${String(panel.x)}" y="${String(panel.y + shadowOffset)}"` +
      ` width="${String(panel.width)}" height="${String(panel.height)}"` +
      ` rx="${String(panel.radius)}" fill="#000000" fill-opacity="0.22"/>`;

    const surface =
      `<rect x="${String(panel.x)}" y="${String(panel.y)}"` +
      ` width="${String(panel.width)}" height="${String(panel.height)}"` +
      ` rx="${String(panel.radius)}" fill="${highlighted.background}"` +
      ` stroke="#ffffff" stroke-opacity="0.12"/>`;

    const body = lines
      .map((tokens, index) => {
        if (tokens.length === 0) {
          return "";
        }

        const baseline = Math.round(
          originY +
            index * step +
            (step - fontSize) / 2 +
            fontSize * ascentRatio,
        );
        const spans = tokens
          .map((token) =>
            tokenSpan(token, originX, charWidth, highlighted.foreground),
          )
          .join("");

        return (
          `<text y="${String(baseline)}" xml:space="preserve"` +
          ` font-family="${escapeXml(config.code.fontFamily)}"` +
          ` font-size="${String(fontSize)}">${spans}</text>`
        );
      })
      .join("");

    const heading =
      title !== undefined && title !== ""
        ? textElement(title, {
            x: Math.round(width / 2),
            y: panel.y - Math.round(titleFs * 0.42),
            fontFamily: config.fontFamily,
            fontSize: titleFs,
            fontWeight: 700,
            fill: config.colors.foreground,
            fillOpacity: 0.95,
            anchor: "middle",
          })
        : "";

    const footer = hasFooter
      ? textElement(config.footer, {
          x: Math.round(width / 2),
          y: height - Math.round(Math.min(width, height) * 0.05),
          fontFamily: config.fontFamily,
          fontSize: footerFs,
          fontWeight: 500,
          fill: config.colors.foreground,
          fillOpacity: 0.78,
          anchor: "middle",
        })
      : "";

    return heading + shadow + surface + body + footer;
  },
};
