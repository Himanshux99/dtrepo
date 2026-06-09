import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),

  // --- Configuration for your React App (src folder) ---
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
    ],
    plugins: {
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'react-refresh/only-export-components': 'warn',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },

  // --- Configuration for your Firebase Functions (functions folder) ---
  {
    files: ['functions/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'commonjs', // Functions use require/module.exports
      globals: globals.node, // Use Node.js globals like 'require' and 'module'
    },
    rules: {
      // You can add specific rules for your functions here if needed
      "no-unused-vars": "warn",
    },
  },
]);