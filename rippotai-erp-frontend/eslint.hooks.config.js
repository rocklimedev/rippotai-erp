import reactHooks from 'eslint-plugin-react-hooks'

// Keep hook order a dedicated CI gate, independent of stylistic lint findings.
export default [
  {
    linterOptions: { reportUnusedDisableDirectives: false },
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: { 'react-hooks/rules-of-hooks': 'error' },
  },
]
