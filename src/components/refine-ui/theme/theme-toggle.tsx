import { Monitor, Moon, Sun } from 'lucide-react'

import { useTheme } from '@/components/refine-ui/theme/theme-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/libs/cn'

type ThemeToggleProps = {
	className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
	const { setTheme, theme } = useTheme()

	const cycleTheme = () => {
		switch (theme) {
			case 'dark':
				setTheme('system')
				break
			case 'light':
				setTheme('dark')
				break
			case 'system':
				setTheme('light')
				break
			default:
				setTheme('light')
		}
	}

	return (
		<Button
			className={cn(
				'rounded-full',
				'border-sidebar-border',
				'bg-transparent',
				className,
				'h-10',
				'w-10'
			)}
			onClick={cycleTheme}
			size="icon"
			variant="outline"
		>
			<Sun
				className={cn(
					'h-[1.2rem]',
					'w-[1.2rem]',
					'rotate-0',
					'scale-100',
					'transition-all',
					'duration-200',
					{
						'-rotate-90 scale-0': theme === 'dark' || theme === 'system'
					}
				)}
			/>
			<Moon
				className={cn(
					'absolute',
					'h-[1.2rem]',
					'w-[1.2rem]',
					'rotate-90',
					'scale-0',
					'transition-all',
					'duration-200',
					{
						'rotate-0 scale-100': theme === 'dark',
						'rotate-90 scale-0': theme === 'light' || theme === 'system'
					}
				)}
			/>
			<Monitor
				className={cn(
					'absolute',
					'h-[1.2rem]',
					'w-[1.2rem]',
					'rotate-0',
					'scale-0',
					'transition-all',
					'duration-200',
					{
						'scale-0': theme === 'light' || theme === 'dark',
						'scale-100': theme === 'system'
					}
				)}
			/>
			<span className="sr-only">Toggle theme (Light → Dark → System)</span>
		</Button>
	)
}

ThemeToggle.displayName = 'ThemeToggle'
