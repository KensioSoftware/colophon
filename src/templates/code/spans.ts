import type { CodeToken } from "../../highlight/index.js";
import { escapeXml } from "../../text/index.js";

/** Fraction of the font size the baseline sits below the glyph box top. */
const ascentRatio = 0.78;

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
 * Where and how the snippet's character grid is drawn.
 */
export interface GridMetrics {
  readonly originX: number;
  readonly originY: number;
  readonly fontSize: number;
  readonly charWidth: number;
  readonly step: number;
  readonly fontFamily: string;
  readonly foreground: string;
}

/**
 * The snippet as one `<text>` element per line, each token positioned
 * absolutely from its character column so indentation survives SVG text flow.
 */
export function codeBody(
  lines: readonly (readonly CodeToken[])[],
  metrics: GridMetrics,
): string {
  const { originX, originY, fontSize, charWidth, step } = metrics;

  return lines
    .map((tokens, index) => {
      if (tokens.length === 0) {
        return "";
      }

      const baseline = Math.round(
        originY + index * step + (step - fontSize) / 2 + fontSize * ascentRatio,
      );
      const spans = tokens
        .map((token) =>
          tokenSpan(token, originX, charWidth, metrics.foreground),
        )
        .join("");

      return (
        `<text y="${String(baseline)}" xml:space="preserve"` +
        ` font-family="${escapeXml(metrics.fontFamily)}"` +
        ` font-size="${String(fontSize)}">${spans}</text>`
      );
    })
    .join("");
}
