import type { NotificationProvider } from '@refinedev/core'
import { toast } from 'sonner'

import { UndoableNotification } from '@/components/refine-ui/notification/undoable-notification'

export function useNotificationProvider(): NotificationProvider {
	return {
		close: (id) => {
			toast.dismiss(id)
		},
		open: ({ cancelMutation, description, key, message, type, undoableTimeout }) => {
			switch (type) {
				case 'error':
					toast.error(message, {
						description,
						id: key,
						richColors: true
					})
					return

				case 'progress': {
					const toastId = key || Date.now()

					toast(
						() => (
							<UndoableNotification
								cancelMutation={cancelMutation}
								description={description}
								message={message}
								onClose={() => toast.dismiss(toastId)}
								undoableTimeout={undoableTimeout}
							/>
						),
						{
							duration: (undoableTimeout || 5) * 1000,
							id: toastId,
							unstyled: true
						}
					)
					return
				}

				case 'success':
					toast.success(message, {
						description,
						id: key,
						richColors: true
					})
					return

				default:
					return
			}
		}
	}
}
