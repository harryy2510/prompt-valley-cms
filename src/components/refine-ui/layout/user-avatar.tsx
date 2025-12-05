import { useGetIdentity } from '@refinedev/core'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/libs/cn'

type User = {
	avatar: string
	email: string
	id: string
	name: string
}

export function UserAvatar() {
	const { data: user, isLoading: userIsLoading } = useGetIdentity<User>()

	if (userIsLoading || !user) {
		return <Skeleton className={cn('h-10', 'w-10', 'rounded-full')} />
	}

	const { avatar, name } = user

	return (
		<Avatar className={cn('h-10', 'w-10')}>
			{avatar && <AvatarImage alt={name} src={avatar} />}
			<AvatarFallback>{getInitials(name)}</AvatarFallback>
		</Avatar>
	)
}

const getInitials = (name = '') => {
	const names = name.split(' ')
	let initials = names[0].substring(0, 1).toUpperCase()

	if (names.length > 1) {
		initials += names[names.length - 1].substring(0, 1).toUpperCase()
	}
	return initials
}

UserAvatar.displayName = 'UserAvatar'
