import { useRefreshButton } from '@refinedev/core'
import type { BaseKey } from '@refinedev/core'
import { RefreshCcw } from 'lucide-react'
import React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/libs/cn'

type RefreshButtonProps = React.ComponentProps<typeof Button> & {
	/**
	 * Target data provider name for API call to be made
	 * @default `"default"`
	 */
	dataProviderName?: string
	/**
	 * `meta` property is used when creating the URL for the related action and path.
	 */
	meta?: Record<string, unknown>
	/**
	 * Data item identifier for the actions with the API
	 * @default Reads `:id` from the URL
	 */
	recordItemId?: BaseKey
	/**
	 * Resource name for API data interactions. `identifier` of the resource can be used instead of the `name` of the resource.
	 * @default Inferred resource name from the route
	 */
	resource?: string
}

export const RefreshButton = ({
	children,
	dataProviderName,
	meta,
	recordItemId,
	ref,
	resource,
	...rest
}: RefreshButtonProps & { ref?: React.RefObject<null | React.ComponentRef<typeof Button>> }) => {
	const {
		label,
		loading,
		onClick: refresh
	} = useRefreshButton({
		dataProviderName,
		id: recordItemId,
		meta,
		resource
	})

	const isDisabled = rest.disabled || loading

	return (
		<Button
			onClick={(e: React.PointerEvent<HTMLButtonElement>) => {
				if (isDisabled) {
					e.preventDefault()
					return
				}
				refresh()
			}}
			{...rest}
			disabled={isDisabled}
			ref={ref}
		>
			{children ?? (
				<div className="flex items-center gap-2">
					<RefreshCcw
						className={cn('h-4 w-4', {
							'animate-spin': loading
						})}
					/>
					<span>{label ?? 'Refresh'}</span>
				</div>
			)}
		</Button>
	)
}

RefreshButton.displayName = 'RefreshButton'
