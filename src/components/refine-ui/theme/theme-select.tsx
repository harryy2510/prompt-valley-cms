import { Check, ChevronDown, Monitor, Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/libs/cn'

import { useTheme } from './theme-provider'

type ThemeOption = {
	icon: ReactNode
	label: string
	value: 'dark' | 'light' | 'system'
}

const themeOptions: Array<ThemeOption> = [
	{
		icon: <Sun className="h-4 w-4" />,
		label: 'Light',
		value: 'light'
	},
	{
		icon: <Moon className="h-4 w-4" />,
		label: 'Dark',
		value: 'dark'
	},
	{
		icon: <Monitor className="h-4 w-4" />,
		label: 'System',
		value: 'system'
	}
]

export function ThemeSelect() {
	const { setTheme, theme } = useTheme()

	const currentTheme = themeOptions.find((option) => option.value === theme)

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					className={cn(
						'w-30',
						'justify-between',
						'px-3',
						'text-left',
						'text-sm',
						'font-normal',
						'text-foreground',
						'hover:bg-accent',
						'hover:text-accent-foreground',
						'focus-visible:outline-none',
						'focus-visible:ring-2',
						'focus-visible:ring-ring'
					)}
					size="lg"
					variant="ghost"
				>
					<div className="flex items-center gap-2">
						{currentTheme?.icon}
						<span>{currentTheme?.label}</span>
					</div>
					<ChevronDown className="h-4 w-4 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-40 space-y-1">
				{themeOptions.map((option) => {
					const isSelected = theme === option.value

					return (
						<DropdownMenuItem
							className={cn('flex items-center gap-2 cursor-pointer relative pr-8', {
								'bg-accent text-accent-foreground': isSelected
							})}
							key={option.value}
							onClick={() => setTheme(option.value)}
						>
							{option.icon}
							<span>{option.label}</span>
							{isSelected && <Check className="h-4 w-4 absolute right-2 text-primary" />}
						</DropdownMenuItem>
					)
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

ThemeSelect.displayName = 'ThemeSelect'
