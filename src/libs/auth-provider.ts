import type { AuthProvider } from '@refinedev/core'

import {
	fetchSessionServer,
	getUserServer,
	sendOtpServer,
	signOutServer,
	verifyOtpServer
} from '@/actions/auth'

export const authProvider: AuthProvider = {
	check: async () => {
		const session = await fetchSessionServer()

		if (session) {
			return {
				authenticated: true
			}
		}

		return {
			authenticated: false,
			logout: true,
			redirectTo: '/login'
		}
	},

	forgotPassword: async () => {
		return {
			error: {
				message: 'Please use the login form to sign up.',
				name: 'ForgotPasswordError'
			},
			success: false
		}
	},

	getIdentity: async () => {
		const user = await getUserServer()

		if (user) {
			return {
				avatar: user.user_metadata?.avatar_url,
				email: user.email,
				id: user.id,
				name: user.user_metadata?.full_name || user.email
			}
		}

		return null
	},

	getPermissions: async () => {
		const user = await getUserServer()
		return (user?.app_metadata?.role as 'admin' | 'user') || null
	},

	login: async ({ email, otp }) => {
		try {
			// Step 1: Send OTP if no token provided
			if (!otp) {
				const result = await sendOtpServer({ data: { email } })

				if (!result.success) {
					return {
						error: {
							message: result.error,
							name: 'LoginError'
						},
						success: false
					}
				}

				return {
					success: true
				}
			}

			// Step 2: Verify OTP
			const result = await verifyOtpServer({ data: { email, token: otp } })

			if (!result.success) {
				return {
					error: {
						message: result.error,
						name: 'LoginError'
					},
					success: false
				}
			}

			return {
				redirectTo: '/',
				success: true
			}
		} catch (e: any) {
			return {
				error: {
					message: e.message || 'Login failed',
					name: 'LoginError'
				},
				success: false
			}
		}
	},

	logout: async () => {
		const result = await signOutServer()

		if (!result.success) {
			return {
				error: {
					message: result.error,
					name: 'LogoutError'
				},
				success: false
			}
		}

		return {
			redirectTo: '/login',
			success: true
		}
	},

	onError: async (error) => {
		console.error(error)
		return { error }
	},

	register: async () => {
		return {
			error: {
				message: 'Please use the login form to sign up.',
				name: 'RegisterError'
			},
			success: false
		}
	},

	updatePassword: async () => {
		return {
			error: {
				message: 'Please use the login form to sign up.',
				name: 'UpdatePasswordError'
			},
			success: false
		}
	}
}
