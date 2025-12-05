import type { Config } from 'prettier'

const config: Config = {
	arrowParens: 'always',
	overrides: [
		{
			files: ['*.jsonc'],
			options: {
				parser: 'json'
			}
		}
	],
	printWidth: 100,
	semi: false,
	singleQuote: true,
	tabWidth: 2,
	trailingComma: 'none',
	useTabs: true
}

export default config
