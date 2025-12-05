import { ScriptOnce } from '@tanstack/react-router'
import { createContext, use, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useLocalStorage } from 'usehooks-ts'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
	children: ReactNode
	defaultTheme?: Theme
	storageKey?: string
}

type ThemeProviderState = {
	setTheme: (theme: Theme) => void
	theme: Theme
}

const initialState: ThemeProviderState = {
	setTheme: () => null,
	theme: 'system'
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

const themeScript = (function () {
	function themeFn() {
		const root = window.document.documentElement

		root.classList.remove('light', 'dark')

		let theme = 'system'
		try {
			const storedValue = localStorage.getItem('refine-ui-theme')
			theme = storedValue || 'system'
		} catch {}

		if (theme === 'system') {
			const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light'
			root.classList.add(systemTheme)
		} else {
			root.classList.add(theme)
		}
	}
	return `(${themeFn.toString()})();`
})()

export function ThemeProvider({
	children,
	defaultTheme = 'system',
	storageKey = 'refine-ui-theme',
	...props
}: ThemeProviderProps) {
	const [theme, setTheme] = useLocalStorage(storageKey, defaultTheme, {
		deserializer: (v) => v as Theme,
		serializer: (v) => v
	})

	useEffect(() => {
		const root = window.document.documentElement

		root.classList.remove('light', 'dark')

		if (theme === 'system') {
			const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light'
			root.classList.add(systemTheme)
		} else {
			root.classList.add(theme)
		}
	}, [theme])

	return (
		<>
			<ScriptOnce children={themeScript} />
			<ThemeProviderContext {...props} value={{ setTheme, theme }}>
				{children}
			</ThemeProviderContext>
		</>
	)
}

export function useTheme() {
	const context = use(ThemeProviderContext)

	if (context === undefined) {
		console.error('useTheme must be used within a ThemeProvider')
	}

	return context
}

ThemeProvider.displayName = 'ThemeProvider'
