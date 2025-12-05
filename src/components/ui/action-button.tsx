import { useTransition } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { toast } from 'sonner'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { LoadingSwap } from '@/components/ui/loading-swap'

export function ActionButton({
	action,
	areYouSureDescription = 'This action cannot be undone.',
	areYouSureTitle = 'Are you sure?',
	confirmLabel = 'Yes',
	requireAreYouSure = false,
	...props
}: ComponentProps<typeof Button> & {
	action: () => Promise<{ error: boolean; message?: string }>
	areYouSureDescription?: ReactNode
	areYouSureTitle?: ReactNode
	confirmLabel?: ReactNode
	requireAreYouSure?: boolean
}) {
	const [isLoading, startTransition] = useTransition()

	function performAction() {
		startTransition(async () => {
			const data = await action()
			if (data.error && data.message) toast.error(data.message)
		})
	}

	if (requireAreYouSure) {
		return (
			<AlertDialog open={isLoading ? true : undefined}>
				<AlertDialogTrigger asChild>
					<Button {...props} />
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{areYouSureTitle}</AlertDialogTitle>
						<AlertDialogDescription>{areYouSureDescription}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							disabled={isLoading}
							onClick={performAction}
						>
							<LoadingSwap isLoading={isLoading}>{confirmLabel}</LoadingSwap>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		)
	}

	return (
		<Button
			{...props}
			disabled={props.disabled ?? isLoading}
			onClick={(e) => {
				performAction()
				props.onClick?.(e)
			}}
		>
			<LoadingSwap className="inline-flex items-center gap-2" isLoading={isLoading}>
				{props.children}
			</LoadingSwap>
		</Button>
	)
}
