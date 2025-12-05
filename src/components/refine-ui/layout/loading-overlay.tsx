import { Loader2 } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/libs/cn'

type LoadingOverlayProps = React.HTMLAttributes<HTMLDivElement> & {
	children: React.ReactNode
	containerClassName?: string
	loading?: boolean
}

export const LoadingOverlay = ({
	children,
	className,
	containerClassName,
	loading = false,
	ref,
	...props
}: LoadingOverlayProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
	if (!loading) return children

	return (
		<div className={cn('relative', containerClassName)} ref={ref} {...props}>
			{children}
			<div
				className={cn(
					'absolute inset-0 z-50 flex items-center justify-center',
					'bg-background/60',
					className
				)}
			>
				<div className="flex flex-col items-center gap-2">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			</div>
		</div>
	)
}

LoadingOverlay.displayName = 'LoadingOverlay'
