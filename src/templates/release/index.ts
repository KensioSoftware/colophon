import { linesHeight, stack, stringList } from "../../layout/index.js";
import type { Template, TemplateContext } from "../../types.js";
import { drawSlot, footerLine } from "../bottom.js";
import { contentArea, gapAfter, imageFrame, markRoom } from "../frame.js";
import { logoElement, logoRect } from "../logo.js";
import { changeBlock } from "./block.js";
import { changesHeight, maxChanges } from "./changes.js";
import { releaseLines } from "./lines.js";

/** How the version and the headline are stacked. */
const lineHeight = 1.2;

/**
 * A release: the version, what it is, and the headline changes as a list.
 *
 * The `changes` prop is what this template has that the others do not. A
 * changelog post's frontmatter usually carries the list already, for the
 * release notes the site builds from it, so the image comes out of fields the
 * post was going to have anyway.
 */
export const releaseTemplate: Template = {
  name: "release",
  render({
    props,
    config,
    dimensions,
    measure,
    logo,
    avatar,
  }: TemplateContext): string {
    const { width, height } = dimensions;
    const { fontFamily, colors } = config;
    const frame = imageFrame(dimensions, config, avatar);
    const { pad } = frame;
    const mark = logoRect(logo, dimensions, pad, "start");

    const area = contentArea(
      frame,
      markRoom(mark?.height, Math.round(height * 0.03)),
    );

    const lines = releaseLines(props, {
      measure,
      fontFamily,
      contentWidth: area.width,
      versionFs: Math.round(height * 0.12),
      headlineFs: Math.round(height * 0.052),
      height,
    });

    const changes = stringList(props["changes"]).slice(0, maxChanges);
    const changeFs = Math.round(height * 0.037);

    const listHeight = changesHeight(changes.length, changeFs);

    const [headSlot, listSlot] = stack(
      [
        { size: linesHeight(lines, lineHeight) },
        {
          size: listHeight,
          gapBefore: gapAfter(listHeight, Math.round(height * 0.06)),
        },
      ],
      area,
    );

    const head = drawSlot(lines, headSlot, {
      fontFamily,
      fill: colors.foreground,
      lineHeight,
    });

    const list = changeBlock(changes, listSlot, changeFs, config, measure);

    const footer = footerLine(config, frame, width, avatar, measure);

    return logoElement(logo, mark) + head + list + footer;
  },
};
