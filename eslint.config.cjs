module.exports = [
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
      },
      parser: require('vue-eslint-parser'),
      parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 2021,
        sourceType: 'module',
      },
    },
    plugins: {
      vue: require('eslint-plugin-vue'),
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {},
  },
];