# Upgrading from 1.x

Adding the [code template](../code-template/) made two small breaking changes.

## `Template.render` may return a promise

`render` now returns `string | Promise<string>`, and `buildSvg` is async.

A custom template that returns a string still works unchanged. What needs
updating is any direct call site of `buildSvg`, which now needs an `await`.

`renderMetaImages` and `generate` were already async, so nothing changes for
code that uses those.

## `MetaImageProps.title` is optional

`title` is no longer required, and `walkContent` and `extractProps` no longer
skip a file that declares props without one.

This is what lets a `code` post describe its image entirely through `code` and
`language`, with no heading above the panel.

If your project relied on a titleless props block being ignored, those posts
will now get images. Return `undefined` from a
[props mapper](../configuration/frontmatter/) to filter them out instead.
