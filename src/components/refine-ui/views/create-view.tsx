import { useBack, useResourceParams, useUserFriendlyName } from '@refinedev/core'
import { ArrowLeftIcon } from 'lucide-react'
import type { PropsWithChildren } from 'react'

import { Breadcrumb } from '@/components/refine-ui/layout/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/libs/cn'

type CreateHeaderProps = PropsWithChildren<{
	headerClassName?: string
	resource?: string
	title?: string
	wrapperClassName?: string
}>

type CreateViewProps = PropsWithChildren<{
	className?: string
}>

export function CreateView({ children, className }: CreateViewProps) {
	return <div className={cn('flex flex-col', 'gap-4', className)}>{children}</div>
}

export const CreateViewHeader = ({
	headerClassName,
	resource: resourceFromProps,
	title: titleFromProps,
	wrapperClassName
}: CreateHeaderProps) => {
	const back = useBack()

	const getUserFriendlyName = useUserFriendlyName()

	const { identifier, resource } = useResourceParams({
		resource: resourceFromProps
	})

	const title =
		titleFromProps ??
		getUserFriendlyName(resource?.meta?.label ?? identifier ?? resource?.name, 'plural')

	return (
		<div className={cn('flex flex-col', 'gap-4', wrapperClassName)}>
			<div className="flex items-center relative gap-2">
				<div className="bg-background z-[2] pr-4">
					<Breadcrumb />
				</div>
				<Separator className={cn('absolute', 'left-0', 'right-0', 'z-[1]')} />
			</div>
			<div className={cn('flex', 'gap-1', 'items-center', '-ml-2.5', headerClassName)}>
				<Button onClick={back} size="icon" variant="ghost">
					<ArrowLeftIcon className="h-4 w-4" />
				</Button>
				<h2 className="text-2xl font-bold">{title}</h2>
			</div>
		</div>
	)
}

CreateView.displayName = 'CreateView'
