# Warnings

Some inputs cannot be honoured exactly. So far the only case is code too long to
render legibly, described in [the code template](../../code-template/).

Colophon renders anyway and reports the compromise through `onWarning`, which
defaults to `console.warn`. Pass your build's logger to route the messages
somewhere else, or a no-op to silence them:

```ts
export default defineConfig({
  onWarning: () => {},
});
```

`generate` prefixes each message with the content file it came from, so a build
over a whole tree still names the post to fix:

```
colophon: content/post/index.md: code snippet does not fit the 1200x630 image at
a legible size: 4 of 13 lines dropped. Shorten the sample, or lower
code.minFontScale to fit it in smaller.
```

`onWarning` is left out of the [rebuild stamp](../../rebuilds/), because where a
message goes cannot change a pixel. It cannot be overridden per size for the
same reason.
