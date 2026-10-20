// @ts-check
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const stylistic = require('@stylistic/eslint-plugin');

module.exports = tseslint.config(
  {
    ignores: ['projects/**/*'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
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
      // Explicit types are kept on variables, even when they could be inferred
      '@typescript-eslint/no-inferrable-types': 'off',
      // Generic type written on the variable: x: Map<A, B> = new Map()
      '@typescript-eslint/consistent-generic-constructors': ['error', 'type-annotation'],
      // Warning only: some unused code belongs to features in progress
      // ignoreRestSiblings: allows removing a property with destructuring, e.g. const { a, ...rest } = obj
      '@typescript-eslint/no-unused-vars': ['warn', { ignoreRestSiblings: true }],
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
