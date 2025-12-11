import { useListButton } from '@refinedev/core'
import type { BaseKey } from '@refinedev/core'
import { List } from 'lucide-react'
import type { ComponentProps, PointerEvent, RefObject } from 'react'

import { Button } from '@/components/ui/button'

type ListButtonProps = ComponentProps<typeof Button> & {
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
	 * Resource name for API data interactions. `identifier` of the resource can be used instead of the `name` of the resource.
	 * @default Inferred resource name from the route
	 */
	resource?: BaseKey
}

export const ListButton = ({
	accessControl,
	children,
	meta,
	onClick,
	ref,
	resource,
	...rest
}: ListButtonProps & { ref?: RefObject<null | ComponentProps<typeof Button>['ref']> }) => {
	const { disabled, hidden, label, LinkComponent, to } = useListButton({
		accessControl,
		meta,
		resource
	})

	const isDisabled = disabled || rest.disabled
	const isHidden = hidden || rest.hidden

	if (isHidden) return null

	return (
		<Button {...rest} asChild disabled={isDisabled} ref={ref}>
			<LinkComponent
				onClick={(e: PointerEvent<HTMLButtonElement>) => {
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
						<List className="w-4 h-4" />
						<span>{label}</span>
					</div>
				)}
			</LinkComponent>
		</Button>
	)
}

ListButton.displayName = 'ListButton'
