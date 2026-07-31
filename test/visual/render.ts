/**
 * Rendering a sample the way a baseline comparison needs it, which is not quite
 * the way a project renders one.
 *
 * Two things are different from `pnpm samples`. Fonts are pinned to files, so
 * the image does not depend on what the machine running it has installed: the
 * gallery is rendered with the default stack, which names Arial and hopes, and
 * a fixture cannot be. And the raster is smaller than the document, since a
 * third of the width is still enough to see a layout change in a pull request
 * and is a tenth of the bytes to commit. The SVG is built at the sample's real
 * dimensions either way, so the layout under review is the real one.
 */
import path from "node:path";

import { resolveConfigForSize } from "../../src/config/size.js";
import { buildSvg, renderSvgToImage } from "../../src/render/index.js";
import type {
  ColophonConfig,
  Dimensions,
  FontSource,
} from "../../src/types.js";
import type { Sample } from "../samples.js";

/** The width every baseline is rasterised at, whatever it was laid out at. */
const reviewWidth = 400;

const fontDir = path.join(process.cwd(), "node_modules/dejavu-fonts-ttf/ttf");

/**
 * The faces the baselines are drawn with. DejaVu is already a dev dependency,
 * and the package ships no fonts of its own. The first entry seeds
 * `fontFamily`, and the mono family has to be named outright because the
 * default code stack asks for typefaces that are not here.
 */
const fonts: readonly FontSource[] = [
  { family: "DejaVu Sans", path: path.join(fontDir, "DejaVuSans.ttf") },
  { path: path.join(fontDir, "DejaVuSans-Bold.ttf") },
  { path: path.join(fontDir, "DejaVuSansMono.ttf") },
  { path: path.join(fontDir, "DejaVuSansMono-Bold.ttf") },
];

/** The sample's own config, with everything machine-dependent pinned down. */
function baselineConfig(sample: Sample): ColophonConfig {
  return {
    ...sample.config,
    fonts,
    systemFonts: false,
    code: { ...sample.config.code, fontFamily: "DejaVu Sans Mono" },
    // One case truncates its snippet on purpose, and a warning on every run
    // would train a reader to ignore the ones that mean something.
    onWarning: (): void => undefined,
  };
}

/** The raster size: `reviewWidth` across, keeping the sample's proportions. */
function reviewDimensions({ dimensions }: Sample): Dimensions {
  const scale = Math.min(1, reviewWidth / dimensions.width);

  return {
    width: Math.round(dimensions.width * scale),
    height: Math.round(dimensions.height * scale),
  };
}

/** Render one sample as the PNG its baseline is compared against. */
export async function renderSample(sample: Sample): Promise<Buffer> {
  const size = { name: sample.name, ...sample.dimensions };
  // Through `resolveConfigForSize`, so this is the config `renderMetaImages`
  // would have handed the template rather than an approximation of it.
  const config = resolveConfigForSize(baselineConfig(sample), size);
  const svg = await buildSvg(sample.props, config, sample.dimensions);

  return renderSvgToImage(svg, reviewDimensions(sample), config);
}
