import pluginJs from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import sortKeysFix from 'eslint-plugin-sort-keys-fix';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  eslintPluginPrettierRecommended,
  { ignores: ['coverage/', 'dist/', 'node_modules/'] },
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    ...pluginJs.configs.recommended,
    plugins: {
      '@stylistic': stylistic,
      import: eslintPluginImport,
      skf: sortKeysFix,
    },
    rules: {
      '@stylistic/quotes': ['error', 'single'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'comma-dangle': ['error', 'always-multiline'],
      curly: ['error', 'all'],
      'eol-last': ['error', 'always'],
      eqeqeq: ['error'],
      'import/order': [
        'error',
        {
          alphabetize: {
            caseInsensitive: true,
            order: 'asc',
          },
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            {
              group: 'internal',
              pattern: '@/**',
            },
          ],
        },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off',
      semi: ['error'],
      'skf/sort-keys-fix': [
        'error',
        'asc',
        {
          caseSensitive: true,
          natural: false,
        },
      ],
      'space-before-blocks': ['error', 'always'],
    },
  },
  ...tseslint.configs.recommended,
];
