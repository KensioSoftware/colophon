import type { Rasteriser } from "../types.js";

/**
 * The default rasteriser outside Node, which is to say there is not one.
 *
 * resvg is a native binary, so a browser or edge build cannot have it and must
 * not import it. A bundler picks this file up through `package.json`'s `browser`
 * field, which is what keeps the native dependency out of that graph entirely.
 *
 * The core builds SVG and mostly stops there, so this is only reached by asking
 * for pixels. `config.rasteriser` is the way to have them: a wasm build of resvg
 * is the obvious one, and that seam exists already.
 */
export const defaultRasteriser: Rasteriser = () => {
  throw new Error(
    "No rasteriser here: resvg is a native module and this build does not" +
      " include it. Set config.rasteriser to one that runs in this" +
      " environment, such as a wasm build, or use buildSvg and rasterise" +
      " elsewhere.",
  );
};
