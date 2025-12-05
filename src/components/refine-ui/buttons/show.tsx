import { useShowButton } from '@refinedev/core'
import type { BaseKey } from '@refinedev/core'
import { Eye } from 'lucide-react'
import React from 'react'

import { Button } from '@/components/ui/button'

type ShowButtonProps = React.ComponentProps<typeof Button> & {
	/**
	 * Access Control configuration for the button
	 * @default `{ enabled: true, hideIfUnauthorized: false }`
	 */
	accessControl?: {
		enabled?: boolean
		hideIfUnauthorized?: boolean
	}
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

export const ShowButton = ({
	accessControl,
	children,
	meta,
	onClick,
	recordItemId,
	ref,
	resource,
	...rest
}: ShowButtonProps & { ref?: React.RefObject<null | React.ComponentRef<typeof Button>> }) => {
	const { disabled, hidden, label, LinkComponent, to } = useShowButton({
		accessControl,
		id: recordItemId,
		meta,
		resource
	})

	const isDisabled = disabled || rest.disabled
	const isHidden = hidden || rest.hidden

	if (isHidden) return null

	return (
		<Button {...rest} asChild disabled={isDisabled} ref={ref}>
			<LinkComponent
				onClick={(e: React.PointerEvent<HTMLButtonElement>) => {
					if (isDisabled) {
						e.preventDefault()
						return
					}
					if (onClick) {
						e.preventDefault()
						onClick(e)
					}
				}}
				replace={false}
				to={to}
			>
				{children ?? (
					<div className="flex items-center gap-2 font-semibold">
						<Eye className="h-4 w-4" />
						<span>{label}</span>
					</div>
				)}
			</LinkComponent>
		</Button>
	)
}

ShowButton.displayName = 'ShowButton'
