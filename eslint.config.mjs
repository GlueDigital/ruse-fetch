// @ts-check

import eslint from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat()

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat?.recommended,
  react.configs.flat?.['jsx-runtime'],
  eslintPluginPrettier,
  ...compat.config({
    extends: ['plugin:react-hooks/recommended']
  }),
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn'
    }
  }
]
