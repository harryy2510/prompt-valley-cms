import { Toaster as Sonner } from 'sonner'
import type { ToasterProps } from 'sonner'

import { useTheme } from '@/components/refine-ui/theme/theme-provider'

export function Toaster({ ...props }: ToasterProps) {
	const { theme = 'system' } = useTheme()

	return (
		<Sonner
			className="toaster group"
			position="bottom-center"
			style={
				{
					'--normal-bg': 'var(--popover)',
					'--normal-border': 'var(--border)',
					'--normal-text': 'var(--popover-foreground)'
				} as React.CSSProperties
			}
			theme={theme as ToasterProps['theme']}
			{...props}
		/>
	)
}
