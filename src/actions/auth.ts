import type { User } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'

import { getSupabaseServerAuthClient } from '@/libs/supabase'

// ============================================
// Types
// ============================================

export type Identity = NonNullable<ReturnType<typeof userToIdentity>>

// ============================================
// Functions
// ============================================

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

// ============================================
// Query Keys
// ============================================

export const authKeys = {
	all: ['auth'] as const,
	identity: () => [...authKeys.all, 'identity'] as const,
	permissions: () => [...authKeys.all, 'permissions'] as const
}

// ============================================
// Server Functions
// ============================================

export const getUserServer = createServerFn({ method: 'GET' }).handler(
	async (): Promise<null | User> => {
		const supabase = getSupabaseServerAuthClient()
		const { data, error } = await supabase.auth.getUser()

		if (error || !data.user) {
			return null
		}

		return data.user
	}
)

export const signOutServer = createServerFn({ method: 'POST' }).handler(async () => {
	const supabase = getSupabaseServerAuthClient()
	const { error } = await supabase.auth.signOut()

	if (error) {
		return { error: error.message, success: false as const }
	}

	return { success: true as const }
})

export const sendOtpServer = createServerFn({ method: 'POST' })
	.inputValidator((data: { email: string }) => data)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerAuthClient()
		const { error } = await supabase.auth.signInWithOtp({
			email: data.email,
			options: {
				shouldCreateUser: true
			}
		})

		if (error) {
			return { error: error.message, success: false as const }
		}

		return { success: true as const }
	})

export const verifyOtpServer = createServerFn({ method: 'POST' })
	.inputValidator((data: { email: string; token: string }) => data)
	.handler(async ({ data }) => {
		const supabase = getSupabaseServerAuthClient()
		const { error } = await supabase.auth.verifyOtp({
			email: data.email,
			token: data.token,
			type: 'email'
		})

		if (error) {
			return { error: error.message, success: false as const }
		}

		return {
			success: true as const
		}
	})

// ============================================
// Query Options
// ============================================

export const identityQueryOptions = () =>
	queryOptions({
		gcTime: 1000 * 60 * 30, // 30 minutes
		queryFn: () => getUserServer().then(userToIdentity),
		queryKey: authKeys.identity(),
		staleTime: 1000 * 60 * 5 // 5 minutes
	})
