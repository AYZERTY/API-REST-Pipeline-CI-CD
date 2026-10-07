import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { globals: globals.node, ecmaVersion: 'latest' },
    rules: {
      'no-console': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      indent: ['error', 2],
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      eqeqeq: 'error',
      'prefer-const': 'error'
    }
  }
];
