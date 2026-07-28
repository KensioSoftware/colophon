import type {
  Manifest,
  ManifestImage,
  ManifestPage,
  MetaTag,
  MetaTagOptions,
} from "../types.js";
import { absoluteUrl } from "./url.js";

/**
 * How landscape an image has to be for a large Twitter card.
 *
 * `summary_large_image` is specified for 2:1 and the Open Graph landscape is
 * 1.91:1, so both clear this; a 1:1 square and a 4:3 do not, and are shown
 * better by `summary` than by a large card that crops them. Choosing between
 * the two is a check every site writes for itself, usually by hardcoding the
 * answer for whichever image it happens to have.
 */
const largeCardRatio = 1.5;

/** The image a page's tags describe: the most landscape one it has. */
function chooseImage(slug: string, page: ManifestPage): ManifestImage {
  const image = page.images[page.widest];

  if (image === undefined) {
    throw new Error(
      `The manifest page "${slug}" names "${page.widest}" as its widest` +
        ` image but has no image by that name.`,
    );
  }

  return image;
}

/** The URL to point at, or a complaint that there is none to point at. */
function imageUrl(
  slug: string,
  image: ManifestImage,
  options: MetaTagOptions | undefined,
): string {
  if (image.url === undefined) {
    throw new Error(
      `The manifest has no URL for "${slug}", so there is nothing to point a` +
        ` meta tag at. Set placement.urlBase, which is what records one.`,
    );
  }

  return absoluteUrl(image.url, options?.baseUrl);
}

/**
 * The social meta tags for one page of a {@link Manifest}.
 *
 * Generating the image is half the job: a site still has to write the tags,
 * and every site ends up with slightly different results — a missing width, a
 * relative URL a crawler cannot resolve, a large card promising an image that
 * is square.
 *
 * A page the manifest does not have gets no tags rather than an error. Not
 * every page has a share image — a props mapper returning `undefined` is how a
 * site says so — and a template asking about one should not have to know in
 * advance.
 *
 * Alt text is emitted for both platforms when the page has any. Twitter reads
 * its own `twitter:image:alt` rather than falling back to the Open Graph one,
 * so leaving it out would mean no alt text on the platform, which is most of
 * the reason for carrying it this far.
 */
export function metaTags(
  manifest: Manifest,
  slug: string,
  options?: MetaTagOptions,
): readonly MetaTag[] {
  const page = manifest.pages[slug];

  if (page === undefined) {
    return [];
  }

  const image = chooseImage(slug, page);
  const url = imageUrl(slug, image, options);
  const isLarge = image.width / image.height >= largeCardRatio;

  return [
    { property: "og:image", content: url },
    { property: "og:image:width", content: String(image.width) },
    { property: "og:image:height", content: String(image.height) },
    ...(page.alt === undefined
      ? []
      : [{ property: "og:image:alt", content: page.alt }]),
    {
      name: "twitter:card",
      content: isLarge ? "summary_large_image" : "summary",
    },
    { name: "twitter:image", content: url },
    ...(page.alt === undefined
      ? []
      : [{ name: "twitter:image:alt", content: page.alt }]),
  ];
}
