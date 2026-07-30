/**
 * The Hugo partial `colophon eject hugo` writes.
 *
 * It is a lookup in the manifest a build wrote, which is the whole point: the
 * two Hugo sites this was taken from spent 50 and 58 lines respectively globbing
 * for `*-og.png` and hardcoding the dimensions, because nothing told them what
 * had been generated.
 *
 * Ejected rather than imported. A partial shipped in `node_modules` would have
 * to be mounted into the site's own `layouts`, and a site that wants to change
 * the fallback chain, or emit one more tag, should be able to just edit it.
 *
 * Verified against Hugo 0.162 over a site covering each branch: a route key, a
 * basename key, a frontmatter slug, a page bundle, a manifest entry with no
 * URL, a page override, a page the manifest does not have, a page with no file
 * at all, and a site with no manifest.
 */
export const hugoPartial = `{{- /*
  Colophon: social meta tags for the current page, from the image manifest.

  Call it from your <head>, passing the page:

      {{ partial "colophon.html" . }}

  It reads the manifest as site data, so point the config's \`manifest\` option
  at \`data/colophon.json\`.

  Needs Hugo 0.156 or newer for \`hugo.Data\`. On an older Hugo, change the two
  references below to \`site.Data\`.

  Colophon writes this file for you and then leaves it alone: it is yours to
  edit. Re-running \`colophon eject hugo --force\` replaces it.
*/ -}}

{{- $pages := dict -}}
{{- with hugo.Data.colophon -}}
  {{- with .pages -}}
    {{- $pages = . -}}
  {{- end -}}
{{- end -}}

{{- /* The manifest is keyed by slug, and which slug depends on the
       \`slugStrategy\` the build used. The route key is tried first and the
       basename second, so one partial covers both without being told which. */ -}}
{{- $keys := slice -}}
{{- with .Params.colophon_key -}}
  {{- $keys = $keys | append . -}}
{{- end -}}
{{- with .Slug -}}
  {{- $keys = $keys | append . -}}
{{- end -}}
{{- $route := strings.TrimPrefix "/" .Path -}}
{{- $keys = $keys | append (cond (eq $route "") "index" $route) -}}
{{- with .File -}}
  {{- $keys = $keys | append .ContentBaseName -}}
{{- end -}}

{{- $entry := dict -}}
{{- range $keys -}}
  {{- if not $entry -}}
    {{- with index $pages . -}}
      {{- $entry = . -}}
    {{- end -}}
  {{- end -}}
{{- end -}}

{{- /* The generated image, where the manifest has one with an address. A
       placement without \`urlBase\` records dimensions and no URL, which is
       nothing to point a crawler at. */ -}}
{{- $image := false -}}
{{- with $entry.images -}}
  {{- $widest := index . $entry.widest -}}
  {{- if $widest -}}
    {{- if $widest.url -}}
      {{- $image = $widest -}}
    {{- end -}}
  {{- end -}}
{{- end -}}

{{- /* An explicit page override wins, then the generated image, then whatever
       the site falls back to. Width, height and alt describe the generated
       image, so they go only with that one. */ -}}
{{- $url := "" -}}
{{- with .Params.images -}}
  {{- $url = index . 0 -}}
  {{- $image = false -}}
{{- else -}}
  {{- with $image -}}
    {{- $url = .url -}}
  {{- else -}}
    {{- with site.Params.images -}}
      {{- $url = index . 0 -}}
    {{- end -}}
  {{- end -}}
{{- end -}}

{{- with $url -}}
  {{- $alt := "" -}}
  {{- if $image -}}
    {{- with $entry.alt -}}
      {{- $alt = . -}}
    {{- end -}}
  {{- end -}}
  {{- /* \`summary_large_image\` is specified for 2:1 and the Open Graph
         landscape is 1.91:1, so both clear this; a square is shown better by
         a plain summary card. Only a generated image has dimensions to judge
         by, so anything else is assumed to be a landscape share image. */ -}}
  {{- $large := true -}}
  {{- with $image -}}
    {{- $large = ge (div (float .width) (float .height)) 1.5 -}}
  {{- end -}}
<meta property="og:image" content="{{ . | absURL }}" />
  {{- with $image }}
<meta property="og:image:width" content="{{ .width }}" />
<meta property="og:image:height" content="{{ .height }}" />
  {{- end }}
  {{- with $alt }}
<meta property="og:image:alt" content="{{ . }}" />
  {{- end }}
<meta name="twitter:card" content="{{ cond $large "summary_large_image" "summary" }}" />
<meta name="twitter:image" content="{{ $url | absURL }}" />
  {{- with $alt }}
<meta name="twitter:image:alt" content="{{ . }}" />
  {{- end }}
{{- end -}}
`;
