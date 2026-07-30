import type { GeneratedImage } from "../generate/index.js";

/** What this run did, or would have done, to one image. */
function verbFor(result: GeneratedImage, isDryRun: boolean): string {
  if (result.skipped) {
    return "skip";
  }

  return isDryRun ? "write" : "wrote";
}

/** Report one image as it is written, or as it is left alone. */
export function reportImage(result: GeneratedImage, isDryRun: boolean): void {
  // The URL is the half of a placement nothing else on the command line
  // would show, and the quickest way to see a `urlBase` is wrong.
  const served = result.url === undefined ? "" : ` -> ${result.url}`;

  console.log(
    `${verbFor(result, isDryRun).padEnd(5)} ${result.outputPath}${served}`,
  );
}

/** Report what a whole run came to. */
export function reportSummary(
  results: readonly GeneratedImage[],
  isDryRun: boolean,
): void {
  const written = results.filter((result) => !result.skipped).length;
  const skipped = String(results.length - written);

  console.log(
    isDryRun
      ? `Dry run: ${String(written)} would be written, ${skipped} already up to date. Nothing was written.`
      : `Done: ${String(written)} written, ${skipped} skipped.`,
  );
}
