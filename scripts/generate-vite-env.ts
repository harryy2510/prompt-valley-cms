import '@dotenvx/dotenvx/config'

import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ──────────────────────────────────────────────────────────────────────────────
// 1. CONFIGURE THESE PATHS
// ──────────────────────────────────────────────────────────────────────────────
const OUT_FILE = resolve(__dirname, '..', 'src', 'vite-env.d.ts')

// ──────────────────────────────────────────────────────────────────────────────
// 3. READ .env, PARSE, GENERATE & WRITE
// ──────────────────────────────────────────────────────────────────────────────
function generate() {
	// env vars
	const env = process.env

	// filter only VITE_ keys (optional)
	const keys = Object.keys(env).filter((k) => k.startsWith('VITE_'))

	// build file content
	const output = makeTemplate(keys)

	// write it out
	writeFileSync(OUT_FILE, output, 'utf8')
	execSync('eslint --fix ' + OUT_FILE, { stdio: 'inherit' })
	execSync('prettier --write ' + OUT_FILE, { stdio: 'inherit' })
	console.log(`✅ Generated ${OUT_FILE}`)
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. A SMALL TEMPLATE FACTORY
// ──────────────────────────────────────────────────────────────────────────────
function makeTemplate(keys: Array<string>): string {
	return `// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface ViteTypeOptions {
      // By adding this line, you can make the type of ImportMetaEnv strict
      // to disallow unknown keys.
      strictImportMetaEnv: unknown
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface ImportMetaEnv {
${keys.map((k) => `     readonly ${k}: string`).join('\n')}
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface ImportMeta {
    readonly env: ImportMetaEnv
}
`
}

generate()
