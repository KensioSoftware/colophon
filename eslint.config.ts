import { smartassPreferSpecificAssertions } from "@kensio/smartass/eslint";
import { defineConfig } from "eslint/config";
import { jsdoc } from "eslint-plugin-jsdoc";
import noSecrets from "eslint-plugin-no-secrets";
import security from "eslint-plugin-security";
import tseslint from "typescript-eslint";

// Oxlint is the main linter for this project; see .oxlintrc.json. It runs the
// ESLint core rules, typescript-eslint (including the type-aware ones),
// unicorn and the Vitest rules, in a fraction of the time ESLint takes.
//
// What is left here is the remainder: the plugins oxlint has no equivalent
// for. None of these need type information, so this pass runs without
// `projectService`, which is what keeps it cheap.

const securityRecommended = security.configs.recommended as Parameters<
  typeof defineConfig
>[0];

export default defineConfig(
  // ── Global ignores ──────────────────────────────────────
  {
    ignores: [
      "dist/",
      "coverage/",
      "test/.coverage/",
      "node_modules/",
      "scripts/",
      "**/*.config.ts",
    ],
  },

  // ── Parse TypeScript, and the one rule oxlint lacks ─────
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: ["property", "objectLiteralProperty", "typeProperty"],
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: "default",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "enumMember",
          format: ["PascalCase"],
        },
        {
          selector: "variable",
          modifiers: ["const", "exported"],
          format: ["camelCase", "UPPER_CASE"],
        },
      ],
    },
  },

  // ── Security (low-cost security checks) ────────────────
  securityRecommended,
  {
    rules: {
      "security/detect-object-injection": "off",
      // Colophon is a build-time tool: it walks a content tree the user pointed
      // it at and writes images to paths derived from those files. Every fs
      // call is non-literal by construction, and the paths come from the user's
      // own argv/config, not from an untrusted request — so the rule only ever
      // fires on the package doing its job.
      "security/detect-non-literal-fs-filename": "off",
    },
  },

  // ── No Secrets (detect accidental secret inclusion) ────────
  {
    plugins: { "no-secrets": noSecrets },
    rules: {
      "no-secrets/no-secrets": "error",
    },
  },

  // ── JSDoc (enforce minimal doc commenting) ────────────────
  jsdoc({
    config: "flat/recommended-error",
  }),
  {
    rules: {
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-returns-description": "off",
      "jsdoc/require-yields": "off",
      "jsdoc/require-description": [
        "error",
        {
          descriptionStyle: "body",
          checkConstructors: false,
          checkGetters: false,
          checkSetters: false,
        },
      ],
      "jsdoc/require-jsdoc": [
        "error",
        {
          contexts: [
            "ClassDeclaration",
            "ExportNamedDeclaration > VariableDeclaration[kind='const'] > VariableDeclarator[init.type='ObjectExpression']",
            "ExportNamedDeclaration > VariableDeclaration[kind='const'] > VariableDeclarator[init.type='ArrayExpression']",
            "ExportNamedDeclaration > VariableDeclaration[kind='const'] > VariableDeclarator[init.type='NewExpression']",
            "ExportNamedDeclaration > VariableDeclaration[kind='const'] > VariableDeclarator[init.type='CallExpression']",
          ],
          publicOnly: true,
          checkConstructors: false,
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
          },
        },
      ],
    },
  },

  // ── Test files ──────────────────────────────────────────
  {
    files: ["**/*.test.ts"],
    rules: {
      // Tests construct real-world fixture data (e.g. snake_case frontmatter keys).
      "@typescript-eslint/naming-convention": "off",
    },
  },

  // ── The Shiki theme registry (Shiki's names, not ours) ──
  {
    files: ["src/highlight/themes.ts"],
    rules: {
      // Every key is a Shiki theme id, and those are kebab-case. They have to
      // be spelled the way Shiki spells them, since that is what a config
      // names and what the registry is looked up by.
      "@typescript-eslint/naming-convention": "off",
    },
  },

  // ── Smartass (steer towards the most specific assertion) ──
  // e.g. assertIdentical(foo.length, 2) → assertArrayLength(foo, 2).
  ...smartassPreferSpecificAssertions,
);
