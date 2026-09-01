import { deflateRawSync } from "node:zlib";

/** The state understood by colophonjs.dev's playground. */
export interface PlaygroundState {
  readonly config: string;
  readonly frontmatter: string;
  readonly size?: string;
}

const playground = "https://colophonjs.dev/playground/";

/** Build the public playground URL for one config and post. */
export function shareUrl(state: PlaygroundState): string {
  const json = JSON.stringify(state);
  const encoded = deflateRawSync(json).toString("base64url");
  const url = new URL(playground);
  url.searchParams.set("s", encoded);

  return url.href;
}
