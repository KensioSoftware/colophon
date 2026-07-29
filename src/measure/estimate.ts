/**
 * Advance width to assume for proportional text, as a fraction of the font
 * size. It is the average over the sort of text a share image carries, mostly
 * lower-case Latin with spaces, for the sans-serif faces a site is likely to
 * use. Nothing here is exact, which is the point of measuring instead.
 */
const defaultRatio = 0.52;

/**
 * Characters that occupy a full em rather than a fraction of one: the CJK
 * ranges, Hangul, kana, the fullwidth forms and emoji.
 *
 * Estimating these at the Latin ratio is what makes a Japanese title overflow
 * by nearly half its width, and no per-template fudge factor can be right for
 * both scripts at once. Widths of the scripts in between, such as Devanagari,
 * are still guesses; those want a font file, which is what measuring is for.
 */
const wideRanges: readonly (readonly [number, number])[] = [
  [0x11_00, 0x11_5f], // Hangul Jamo
  [0x2e_80, 0x30_3e], // CJK radicals and punctuation
  [0x30_41, 0x33_ff], // Kana through the CJK compatibility forms
  [0x34_00, 0x4d_bf], // CJK extension A
  [0x4e_00, 0x9f_ff], // CJK unified ideographs
  [0xa0_00, 0xa4_cf], // Yi
  [0xac_00, 0xd7_a3], // Hangul syllables
  [0xf9_00, 0xfa_ff], // CJK compatibility ideographs
  [0xfe_30, 0xfe_4f], // CJK compatibility forms
  [0xff_00, 0xff_60], // Fullwidth forms, but not the halfwidth kana after them
  [0xff_e0, 0xff_e6], // Fullwidth currency and bar symbols
  [0x1_f3_00, 0x1_fa_ff], // Emoji
  [0x2_00_00, 0x3_ff_fd], // CJK extensions B onwards
];

function isWide(character: string): boolean {
  const point = character.codePointAt(0) ?? 0;
  return wideRanges.some(([from, to]) => point >= from && point <= to);
}

/**
 * How much wider a face gets as its weight rises. A bold cut of a family runs
 * around a tenth wider than its regular; heavier than bold, little more.
 */
function weightFactor(weight: number): number {
  return 1 + Math.min(Math.max(weight - 400, 0) / 400, 1) * 0.1;
}

/**
 * Width of `text` when there is no font to measure it in, either because none
 * were configured or because the stack names one the build did not load.
 *
 * It is a guess, and a build that wants text laid out to the pixel supplies
 * the font as a file. What it is not is a guess a template has to make: the
 * one ratio lives here, where the reason for it can be written down once.
 */
export function estimateWidth(
  text: string,
  fontSize: number,
  weight: number,
  ratio = defaultRatio,
): number {
  let ems = 0;

  for (const character of text) {
    ems += isWide(character) ? 1 : ratio;
  }

  return ems * fontSize * weightFactor(weight);
}
