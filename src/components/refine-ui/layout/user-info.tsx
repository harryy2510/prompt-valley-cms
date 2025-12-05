import { useGetIdentity } from '@refinedev/core'

import { UserAvatar } from '@/components/refine-ui/layout/user-avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/libs/cn'

type User = {
	avatar: string
	email: string
	id: string
	name: string
}

export function UserInfo() {
	const { data: user, isLoading: userIsLoading } = useGetIdentity<User>()

	if (userIsLoading || !user) {
		return (
			<div className={cn('flex', 'items-center', 'gap-x-2')}>
				<Skeleton className={cn('h-10', 'w-10', 'rounded-full')} />
				<div className={cn('flex', 'flex-col', 'justify-between', 'h-10')}>
					<Skeleton className={cn('h-4', 'w-32')} />
					<Skeleton className={cn('h-4', 'w-24')} />
				</div>
			</div>
		)
	}

	const { email, name } = user

	return (
		<div className={cn('flex', 'items-center', 'gap-x-2')}>
			<UserAvatar />
			<div className={cn('flex', 'flex-col', 'justify-between', 'h-10', 'text-left')}>
				<span className={cn('text-sm', 'font-medium', 'text-muted-foreground')}>{name}</span>
				<span className={cn('text-xs', 'text-muted-foreground')}>{email}</span>
			</div>
		</div>
	)
}

UserInfo.displayName = 'UserInfo'
