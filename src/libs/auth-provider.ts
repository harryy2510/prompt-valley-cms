import type { AuthProvider } from '@refinedev/core'
import { queryOptions, useQuery } from '@tanstack/react-query'

import { getUserServer, sendOtpServer, signOutServer, verifyOtpServer } from '@/actions/auth'
import { userToIdentity } from '@/utils/user'

export type Identity = NonNullable<ReturnType<typeof userToIdentity>>

// ============================================
// Query Keys
// ============================================

export const authKeys = {
	all: ['auth'] as const,
	identity: () => [...authKeys.all, 'identity'] as const,
	permissions: () => [...authKeys.all, 'permissions'] as const
}

export function useAuthProvider(): AuthProvider {
	const { data: identity } = useQuery(identityQueryOptions())

	return {
		check: () => {
			if (identity) {
				return Promise.resolve({
					authenticated: true
				})
			}

			return Promise.resolve({
				authenticated: false,
				logout: true
			})
		},

		getIdentity: () => {
			return Promise.resolve(identity)
		},

		getPermissions: () => {
			return Promise.resolve(identity?.role || null)
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
				success: true
			}
		},
		onError: async (error) => {
			console.error(error)
			return Promise.resolve({ error })
		}
	}
}

export const identityQueryOptions = () =>
	queryOptions({
		gcTime: 1000 * 60 * 30, // 30 minutes
		queryFn: () => getUserServer().then(userToIdentity),
		queryKey: authKeys.identity(),
		staleTime: 1000 * 60 * 5 // 5 minutes
	})
