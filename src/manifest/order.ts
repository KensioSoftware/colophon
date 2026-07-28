/**
 * Order two names by code unit, rather than by whatever the machine's locale
 * would say.
 *
 * The manifest is written into a site's repository and committed, so the order
 * has to be the same on a laptop and on CI. `localeCompare` reads the default
 * locale, and locales disagree about case and accented letters — a slug of
 * `Über` or `MyPost` could sort one way in development and another in the
 * build, leaving a diff that says nothing happened.
 */
export function byName(a: string, b: string): number {
  if (a === b) {
    return 0;
  }

  return a < b ? -1 : 1;
}
