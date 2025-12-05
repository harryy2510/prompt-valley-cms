import { tanstackConfig } from '@tanstack/eslint-config'
import prettierConfig from 'eslint-config-prettier'
import perfectionist from 'eslint-plugin-perfectionist'
import reactDom from 'eslint-plugin-react-dom'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactX from 'eslint-plugin-react-x'
import globals from 'globals'

export default [
	{
		ignores: ['src/types/database.types.ts'],
		name: 'ignore-database-types'
	},
	...tanstackConfig,

	// Override language options to match tsconfig
	{
		files: ['**/*.{ts,tsx,js,jsx}'],
		languageOptions: {
			ecmaVersion: 2023,
			globals: {
				...globals.browser,
				...globals.es2023
			}
		},
		name: 'custom/language-options'
	},

	// React plugins
	{
		files: ['**/*.{ts,tsx,js,jsx}'],
		name: 'custom/react',
		plugins: {
			'react-dom': reactDom,
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
			'react-x': reactX
		},
		rules: {
			...reactHooks.configs['recommended-latest'].rules,
			...reactRefresh.configs.vite.rules,
			...reactX.configs['recommended-typescript'].rules,
			...reactDom.configs.recommended.rules,
			'react-refresh/only-export-components': 'off'
		}
	},

	// Perfectionist for better sorting
	perfectionist.configs['recommended-natural'],
	{
		name: 'custom/perfectionist',
		rules: {
			// Disable conflicting rules from tanstack config
			'import/order': 'off',
			'perfectionist/sort-enums': ['error', { order: 'asc', type: 'natural' }],

			'perfectionist/sort-exports': ['error', { order: 'asc', type: 'natural' }],
			'perfectionist/sort-imports': [
				'error',
				{
					customGroups: {
						type: {
							internal: ['^@/']
						},
						value: {
							internal: ['^@/']
						}
					},
					groups: [
						'side-effect',
						'side-effect-style',
						['builtin', 'builtin-type'],
						['external', 'external-type'],
						['internal', 'internal-type'],
						['parent', 'parent-type'],
						['sibling', 'sibling-type'],
						['index', 'index-type'],
						'object',
						'style',
						'unknown'
					],
					internalPattern: ['^@/.+'],
					newlinesBetween: 'always',
					order: 'asc',
					type: 'natural'
				}
			],
			'perfectionist/sort-interfaces': ['error', { order: 'asc', type: 'natural' }],
			'perfectionist/sort-named-exports': ['error', { order: 'asc', type: 'natural' }],
			'perfectionist/sort-named-imports': ['error', { order: 'asc', type: 'natural' }],
			'perfectionist/sort-object-types': ['error', { order: 'asc', type: 'natural' }],
			'perfectionist/sort-objects': ['error', { order: 'asc', type: 'natural' }],
			'perfectionist/sort-union-types': ['error', { order: 'asc', type: 'natural' }],
			'sort-imports': 'off'
		}
	},

	// Additional TypeScript rules
	{
		name: 'custom/typescript',
		rules: {
			'@typescript-eslint/consistent-type-definitions': ['error', 'type'],
			'@typescript-eslint/consistent-type-exports': [
				'error',
				{ fixMixedExportsWithInlineTypeSpecifier: true }
			],
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{
					fixStyle: 'inline-type-imports',
					prefer: 'type-imports'
				}
			],
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-unnecessary-condition': 'off',
			eqeqeq: ['error', 'always']
		}
	},

	// Additional React rules
	{
		name: 'custom/typescript',
		rules: {
			'react-x/no-array-index-key': 'off'
		}
	},

	// Prettier must be last
	prettierConfig
]
