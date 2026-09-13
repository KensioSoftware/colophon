---
description: Handle Colophon warnings about truncated code, invalid badges and image file size limits.
---

# Warnings

Colophon renders an image and reports a warning when it has to:

- Truncate a [code snippet](../../code-template/) or `terminal` session.
- Omit a code mark whose text or position is outside the visible snippet.
- Ignore an invalid [badge](../../templates/).
- Exceed a [`maxBytes`](../formats/#capping-the-size) limit at the lowest
  quality.

Warnings go to `onWarning`, which defaults to `console.warn`. Supply a
callback to use your build's logger, or a no-op function to silence warnings:

```ts
export default defineConfig({
  onWarning: () => {},
});
```

`generate` prefixes each warning with the content file's path:

```text
colophon: content/post/index.md: code snippet does not fit the 1200x630 image at
a legible size: 4 of 13 lines dropped. Shorten the sample, or lower
code.minFontScale to fit it in smaller.
```

`onWarning` is shared by all output sizes and excluded from
[rebuild stamps](../../rebuilds/). Changing the callback does not trigger
image regeneration.
