import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Disable warnings about fast refresh in UI library components
      'react-refresh/only-export-components': 'off',
      // Allow setState in effects for resetting state on prop/derived-state changes
      // This is a valid pattern per React docs for "resetting all state when a prop changes"
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
