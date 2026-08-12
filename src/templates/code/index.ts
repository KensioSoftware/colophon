import { highlightCode } from "../../highlight/index.js";
import type { Template } from "../../types.js";
import { hasFooter } from "../footer.js";
import { optionalString } from "../../props.js";
import { barRoom, windowBar } from "./bar.js";
import { codeFooter, codeHeading } from "./chrome.js";
import { blockColumns } from "./fit.js";
import { gutterColumns, numberLines } from "./gutter.js";
import { fitSnippet } from "./layout.js";
import { layoutPanel, titleBand } from "./panel.js";
import { hugPanel, panelSvg } from "./plate.js";
import { codeBody } from "./spans.js";
import { warnIfTruncated } from "./warn.js";
import { charWidthRatio } from "./width.js";

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
  async render({ props, config, dimensions, measure }): Promise<string> {
    const { width, height } = dimensions;
    const title = optionalString(props.title);
    const titleFs = Math.round(height * 0.045);
    const footerFs = Math.round(height * 0.032);

    const highlighted = await highlightCode(
      optionalString(props["code"]) ?? "",
      {
        language: optionalString(props["language"]) ?? "text",
        theme: optionalString(props["theme"]) ?? config.code.theme,
        tabSize: config.code.tabSize,
      },
    );

    const available = layoutPanel(
      dimensions,
      config,
      titleFs,
      footerFs,
      title !== undefined && title !== "",
      hasFooter(config),
    );
    const bar = barRoom(config, available.width);
    const gutter = gutterColumns(config, highlighted.lines.length);

    const fitted = fitSnippet(
      highlighted,
      { ...available, y: available.y + bar, height: available.height - bar },
      width,
      config,
      charWidthRatio(measure, config.code.fontFamily),
      gutter,
    );

    const dropped = highlighted.lines.length - fitted.lines.length;

    warnIfTruncated(
      config,
      dimensions,
      { dropped, clipped: fitted.clipped },
      highlighted.lines.length,
    );

    const lines = numberLines(fitted.lines, gutter, dropped);

    // Shrink the panel down onto the snippet so it isn't left floating in dead
    // space. On a landscape image especially, a wide panel holding a narrow
    // block leaves the code marooned off to one side.
    const bodyHeight = fitted.lines.length * fitted.step;
    const panel = hugPanel(available, {
      width: blockColumns(lines) * fitted.charWidth + fitted.padding * 2,
      height: bar + bodyHeight + fitted.padding * 2,
    });

    const body = codeBody(lines, {
      // Code reads from the left edge, as it does in an editor. Indentation is
      // carried by each token's column, so the snippet keeps its shape.
      originX: panel.x + fitted.padding,
      originY: panel.y + bar + (panel.height - bar - bodyHeight) / 2,
      fontSize: fitted.fontSize,
      charWidth: fitted.charWidth,
      step: fitted.step,
      fontFamily: config.code.fontFamily,
      foreground: highlighted.foreground,
    });

    const shadowOffset = Math.round(Math.min(width, height) * 0.01);
    const plate = panelSvg(
      panel,
      highlighted.background,
      Math.max(1, shadowOffset),
      config,
    );

    return (
      codeHeading(
        title,
        titleBand(panel, dimensions, titleFs),
        titleFs,
        config,
      ) +
      plate +
      windowBar(panel, bar, props, config, measure) +
      body +
      codeFooter(dimensions, footerFs, config)
    );
  },
};
