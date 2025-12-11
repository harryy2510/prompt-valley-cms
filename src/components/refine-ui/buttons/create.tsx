import { useCreateButton } from '@refinedev/core'
import type { BaseKey } from '@refinedev/core'
import { Plus } from 'lucide-react'
import type { ComponentProps, PointerEvent, RefObject } from 'react'

import { Button } from '@/components/ui/button'

type CreateButtonProps = ComponentProps<typeof Button> & {
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

export const CreateButton = ({
	accessControl,
	children,
	meta,
	onClick,
	ref,
	resource,
	...rest
}: CreateButtonProps & { ref?: RefObject<null | ComponentProps<typeof Button>['ref']> }) => {
	const { disabled, hidden, label, LinkComponent, to } = useCreateButton({
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
						<Plus className="w-4 h-4" />
						<span>{label ?? 'Create'}</span>
					</div>
				)}
			</LinkComponent>
		</Button>
	)
}

CreateButton.displayName = 'CreateButton'
