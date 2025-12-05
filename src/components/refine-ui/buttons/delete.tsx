import { useDeleteButton } from '@refinedev/core'
import type { BaseKey } from '@refinedev/core'
import { Loader2, Trash } from 'lucide-react'
import React from 'react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type DeleteButtonProps = React.ComponentProps<typeof Button> & {
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

export const DeleteButton = ({
	accessControl,
	children,
	meta,
	recordItemId,
	ref,
	resource,
	...rest
}: DeleteButtonProps & { ref?: React.RefObject<null | React.ComponentRef<typeof Button>> }) => {
	const {
		cancelLabel: defaultCancelLabel,
		confirmOkLabel: defaultConfirmOkLabel,
		confirmTitle: defaultConfirmTitle,
		disabled,
		hidden,
		label,
		loading,
		onConfirm
	} = useDeleteButton({
		accessControl,
		id: recordItemId,
		meta,
		resource
	})
	const [open, setOpen] = React.useState(false)

	const isDisabled = disabled || rest.disabled || loading
	const isHidden = hidden || rest.hidden

	if (isHidden) return null

	const confirmCancelText = defaultCancelLabel
	const confirmOkText = defaultConfirmOkLabel
	const confirmTitle = defaultConfirmTitle

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<span>
					<Button variant="destructive" {...rest} disabled={isDisabled} ref={ref}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{children ?? (
							<div className="flex items-center gap-2 font-semibold">
								<Trash className="h-4 w-4" />
								<span>{label}</span>
							</div>
						)}
					</Button>
				</span>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-auto">
				<div className="flex flex-col gap-2">
					<p className="text-sm">{confirmTitle}</p>
					<div className="flex justify-end gap-2">
						<Button onClick={() => setOpen(false)} size="sm" variant="outline">
							{confirmCancelText}
						</Button>
						<Button
							disabled={loading}
							onClick={() => {
								if (typeof onConfirm === 'function') {
									onConfirm()
								}
								setOpen(false)
							}}
							size="sm"
							variant="destructive"
						>
							{confirmOkText}
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}

DeleteButton.displayName = 'DeleteButton'
