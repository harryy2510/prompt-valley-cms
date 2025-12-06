import type { User } from '@supabase/supabase-js'
import { createServerFn } from '@tanstack/react-start'

import { getSupabaseServerAuthClient } from '@/libs/supabase'

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
