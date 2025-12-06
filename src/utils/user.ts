import type { User } from '@supabase/supabase-js'

export function userToIdentity(user?: null | User) {
	if (user?.email) {
		return {
			avatar: user.user_metadata?.avatar_url as string | undefined,
			email: user.email,
			id: user.id,
			name: (user.user_metadata?.full_name as string | undefined) || user.email,
			role: (user.app_metadata?.role || 'user') as 'admin' | 'user'
		} as const
	}
	return null
}
