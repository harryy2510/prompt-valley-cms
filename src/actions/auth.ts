import type { User as AuthUser, Session } from '@supabase/supabase-js'
import { createServerFn } from '@tanstack/react-start'
import dayjs from 'dayjs'

import { getSupabaseServerAuthClient } from '@/libs/supabase/server'

export const fetchSessionServer = createServerFn({ method: 'GET' }).handler(
	async (): Promise<null | Session> => {
		const supabase = getSupabaseServerAuthClient()
		const { data, error } = await supabase.auth.getSession()

		if (error || !data.session?.access_token) {
			return null
		}

		if (dayjs.unix(data.session.expires_at!).isBefore(dayjs())) {
			return null
		}

		return data.session
	}
)

export const getUserServer = createServerFn({ method: 'GET' }).handler(
	async (): Promise<AuthUser | null> => {
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
		const { data: authData, error } = await supabase.auth.verifyOtp({
			email: data.email,
			token: data.token,
			type: 'email'
		})

		if (error) {
			return { error: error.message, success: false as const }
		}

		return {
			session: authData.session,
			success: true as const,
			user: authData.user
		}
	})
