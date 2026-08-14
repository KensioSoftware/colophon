import { optionalString } from "../../props.js";
import type { Template } from "../../types.js";
import { codeAdvance } from "../code/advance.js";
import { codeFooter } from "../code/chrome.js";
import { blockWidth } from "../code/extent.js";
import { fitSnippet } from "../code/layout.js";
import { layoutPanel } from "../code/panel.js";
import { hugPanel, panelSvg } from "../code/plate.js";
import { codeBody } from "../code/spans.js";
import { warnIfTruncated } from "../code/warn.js";
import { footerFontSize, hasFooter } from "../footer.js";
import { barHeight, titleBar } from "../window/index.js";
import { terminalSession } from "./session.js";

/**
 * A command and what it printed, in a terminal window.
 *
 * Reads `command`, `output`, an optional `prompt` (`$` by default) and an
 * optional `title` for the window bar. What separates it from the `code`
 * template is the chrome: the same text on a plain panel is a snippet, and in
 * a window it is something somebody ran.
 *
 * Almost all of it is the `code` template underneath, down to the character
 * grid, the fitting and the truncation warning, so everything under
 * `config.code` applies here too: the monospace family, the line height, the
 * syntax theme the window takes its colours from, and the font-size bounds.
 */
export const terminalTemplate: Template = {
  name: "terminal",
  async render({ props, config, dimensions, measure }): Promise<string> {
    const { width, height } = dimensions;
    const footerFs = footerFontSize(dimensions);
    const session = await terminalSession(props, config);

    const available = layoutPanel(
      dimensions,
      config,
      0,
      footerFs,
      false,
      hasFooter(config),
    );
    // The bar is measured against the space the window was allotted rather
    // than against the window it ends up as, so that the room reserved for it
    // and the bar that is drawn are the same height.
    const bar = barHeight(available.width);
    const advance = codeAdvance(measure, config.code.fontFamily);

    const fitted = fitSnippet(
      session,
      { ...available, y: available.y + bar, height: available.height - bar },
      width,
      config,
      advance,
    );

    warnIfTruncated(
      config,
      dimensions,
      {
        dropped: session.lines.length - fitted.lines.length,
        clipped: fitted.clipped,
      },
      session.lines.length,
      "terminal session",
    );

    const body = fitted.lines.length * fitted.step;
    const window = hugPanel(available, {
      width:
        blockWidth(fitted.lines, advance) * fitted.fontSize +
        fitted.padding * 2,
      height: bar + body + fitted.padding * 2,
    });

    const shadow = Math.max(1, Math.round(Math.min(width, height) * 0.01));

    return (
      panelSvg(window, session.background, shadow, config) +
      titleBar(
        window,
        bar,
        optionalString(props.title) ?? "",
        config,
        measure,
      ) +
      codeBody(fitted.lines, {
        originX: window.x + fitted.padding,
        originY: window.y + bar + (window.height - bar - body) / 2,
        fontSize: fitted.fontSize,
        advance,
        step: fitted.step,
        fontFamily: config.code.fontFamily,
        foreground: session.foreground,
      }) +
      codeFooter(dimensions, footerFs, config)
    );
  },
};
