import { linesHeight, stack } from "../../layout/index.js";
import type { Template, TemplateContext } from "../../types.js";
import { drawSlot, footerLine } from "../bottom.js";
import { contentArea, imageFrame } from "../frame.js";
import { attributionText, quoteLines } from "./lines.js";
import { markBand, quoteMark } from "./mark.js";
import { speaker, speakerRoom } from "./speaker.js";

/** How the lines of the quotation are stacked. */
const lineHeight = 1.3;

/**
 * A pull quote: the quotation mark, the words, and who said them.
 *
 * The quotation is the whole image, so there is no logo up in the corner
 * competing with it. What the post carries instead is the speaker: an `author`
 * and an optional `role`, with the `avatar` prop drawn beside them where there
 * is one.
 */
export const quoteTemplate: Template = {
  name: "quote",
  render({
    props,
    config,
    dimensions,
    measure,
    avatar,
  }: TemplateContext): string {
    const { height } = dimensions;
    const { fontFamily, colors } = config;
    // The avatar goes on the attribution line rather than the footer, so as
    // far as the frame is concerned there is none.
    const frame = imageFrame(dimensions, config, undefined, {
      padScale: 0.09,
    });
    const area = contentArea(frame);

    const lines = quoteLines(props, {
      measure,
      fontFamily,
      contentWidth: area.width,
      quoteFs: Math.round(height * 0.075),
    });

    const markFs = Math.round(height * 0.17);
    const said = attributionText(props);
    const saidFs = Math.round(height * 0.04);

    const [markSlot, textSlot, saidSlot] = stack(
      [
        { size: markBand(markFs) },
        {
          size: linesHeight(lines, lineHeight),
          gapBefore: Math.round(height * 0.03),
        },
        {
          size: speakerRoom(said, saidFs, avatar),
          gapBefore: Math.round(height * 0.055),
        },
      ],
      area,
    );

    const body = drawSlot(lines, textSlot, {
      fontFamily,
      fill: colors.foreground,
      lineHeight,
      anchor: "middle",
    });

    return (
      quoteMark(markSlot, markFs, fontFamily, colors.brandWarm) +
      body +
      speaker(said, saidSlot, saidFs, config, avatar, measure) +
      footerLine(config, frame, undefined, measure, "middle", 0.7)
    );
  },
};
