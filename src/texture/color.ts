/**
 * The colour a texture draws in where the palette did not supply one.
 *
 * `resolveTexture` fills the foreground colour in for anything that came
 * through config, so this is only reached by a texture built by hand, such as
 * one a test or a custom template passes to `textureSvg` directly. It is here
 * rather than in either drawing module because both of them need it.
 */
export const fallbackColor = "#ffffff";
