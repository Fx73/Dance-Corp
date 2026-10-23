// @ts-check
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const stylistic = require('@stylistic/eslint-plugin');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      // Formatting rules from CLAUDE.md
      // One blank line at most, and one blank line between methods
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
      '@stylistic/lines-between-class-members': ['error', { enforce: [{ blankLine: 'always', prev: 'method', next: 'method' }] }],
      // Semicolon-free style, and catch lines that would be joined to the previous one
      '@stylistic/semi': ['error', 'never'],
      // Interface and type members: no delimiter on multiple lines, commas on a single line
      '@stylistic/member-delimiter-style': ['error', { multiline: { delimiter: 'none' }, singleline: { delimiter: 'comma', requireLast: false } }],
      'no-unexpected-multiline': 'error',
      // Naming from CLAUDE.md: methods and functions in PascalCase (C# convention),
      // except names called by the framework or an external API.
      // classMethod also matches properties holding an arrow function: UPPER_CASE is allowed for constant lambdas.
      '@typescript-eslint/naming-convention': ['error', {
        selector: ['classMethod', 'typeMethod', 'function'],
        format: ['PascalCase', 'UPPER_CASE'],
        filter: {
          regex: '^(ng[A-Z]\\w*|ionView\\w*|toJSON|toString|valueOf|toFirestore|fromFirestore|canActivate|canDeactivate|canMatch|resolve|transform|writeValue|registerOnChange|registerOnTouched|setDisabledState)$',
          match: false,
        },
      }],
      // Explicit types are kept on variables, even when they could be inferred
      '@typescript-eslint/no-inferrable-types': 'off',
      // Generic type written on the variable: x: Map<A, B> = new Map()
      '@typescript-eslint/consistent-generic-constructors': ['error', 'type-annotation'],
      // Warning only: some unused code belongs to features in progress
      // ignoreRestSiblings: allows removing a property with destructuring, e.g. const { a, ...rest } = obj
      '@typescript-eslint/no-unused-vars': ['warn', { ignoreRestSiblings: true }],
      // Async calls are awaited, or marked with void when they are fire-and-forget on purpose
      '@typescript-eslint/no-floating-promises': 'error',
      '@angular-eslint/component-class-suffix': [
        'error',
        {
          suffixes: ['Page', 'Component'],
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
);
