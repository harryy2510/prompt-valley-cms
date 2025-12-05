import type { AuthProvider } from '@refinedev/core'

import {
  fetchSessionServer,
  getUserServer,
  sendOtpServer,
  signOutServer,
  verifyOtpServer,
} from '@/actions/auth'

export const authProvider: AuthProvider = {
  login: async ({ email, otp }) => {
    try {
      // Step 1: Send OTP if no token provided
      if (!otp) {
        const result = await sendOtpServer({ data: { email } })

        if (!result.success) {
          return {
            success: false,
            error: {
              name: 'LoginError',
              message: result.error,
            },
          }
        }

        return {
          success: true,
        }
      }

      // Step 2: Verify OTP
      const result = await verifyOtpServer({ data: { email, token: otp } })

      if (!result.success) {
        return {
          success: false,
          error: {
            name: 'LoginError',
            message: result.error,
          },
        }
      }

      return {
        success: true,
        redirectTo: '/',
      }
    } catch (e: any) {
      return {
        success: false,
        error: {
          name: 'LoginError',
          message: e.message || 'Login failed',
        },
      }
    }
  },

  logout: async () => {
    const result = await signOutServer()

    if (!result.success) {
      return {
        success: false,
        error: {
          name: 'LogoutError',
          message: result.error,
        },
      }
    }

    return {
      success: true,
      redirectTo: '/login',
    }
  },

  check: async () => {
    const session = await fetchSessionServer()

    if (session) {
      return {
        authenticated: true,
      }
    }

    return {
      authenticated: false,
      redirectTo: '/login',
      logout: true,
    }
  },

  getPermissions: async () => {
    const user = await getUserServer()
    return (user?.app_metadata?.role as 'admin' | 'user') || null
  },

  getIdentity: async () => {
    const user = await getUserServer()

    if (user) {
      return {
        id: user.id,
        name: user.user_metadata?.full_name || user.email,
        email: user.email,
        avatar: user.user_metadata?.avatar_url,
      }
    }

    return null
  },

  onError: async (error) => {
    console.error(error)
    return { error }
  },

  register: async () => {
    return {
      success: false,
      error: {
        name: 'RegisterError',
        message: 'Please use the login form to sign up.',
      },
    }
  },

  forgotPassword: async () => {
    return {
      success: false,
      error: {
        name: 'ForgotPasswordError',
        message: 'Please use the login form to sign up.',
      },
    }
  },

  updatePassword: async () => {
    return {
      success: false,
      error: {
        name: 'UpdatePasswordError',
        message: 'Please use the login form to sign up.',
      },
    }
  },
}
