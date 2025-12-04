import { AuthProvider } from '@refinedev/core'
import { supabase } from './supabase'

export const authProvider: AuthProvider = {
  login: async ({ email, password, providerName }) => {
    try {
      if (providerName === 'google') {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
          },
        })
        if (error) {
          return {
            success: false,
            error: {
              name: 'LoginError',
              message: error.message,
            },
          }
        }
        return {
          success: true,
        }
      }

      if (providerName === 'github') {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
          },
        })
        if (error) {
          return {
            success: false,
            error: {
              name: 'LoginError',
              message: error.message,
            },
          }
        }
        return {
          success: true,
        }
      }

      // Email/Password login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return {
          success: false,
          error: {
            name: 'LoginError',
            message: error.message,
          },
        }
      }

      return {
        success: true,
        redirectTo: '/dashboard',
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
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: {
          name: 'LogoutError',
          message: error.message,
        },
      }
    }

    return {
      success: true,
      redirectTo: '/login',
    }
  },
  check: async () => {
    const { data } = await supabase.auth.getSession()

    if (data.session) {
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
    const { data } = await supabase.auth.getUser()
    return data?.user?.role || null
  },
  getIdentity: async () => {
    const { data } = await supabase.auth.getUser()

    if (data?.user) {
      return {
        id: data.user.id,
        name: data.user.user_metadata?.full_name || data.user.email,
        email: data.user.email,
        avatar: data.user.user_metadata?.avatar_url,
      }
    }

    return null
  },
  onError: async (error) => {
    console.error(error)
    return { error }
  },
  register: async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return {
          success: false,
          error: {
            name: 'RegisterError',
            message: error.message,
          },
        }
      }

      return {
        success: true,
        redirectTo: '/dashboard',
      }
    } catch (e: any) {
      return {
        success: false,
        error: {
          name: 'RegisterError',
          message: e.message || 'Registration failed',
        },
      }
    }
  },
  forgotPassword: async ({ email }) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) {
        return {
          success: false,
          error: {
            name: 'ForgotPasswordError',
            message: error.message,
          },
        }
      }

      return {
        success: true,
      }
    } catch (e: any) {
      return {
        success: false,
        error: {
          name: 'ForgotPasswordError',
          message: e.message || 'Failed to send reset email',
        },
      }
    }
  },
  updatePassword: async ({ password }) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        return {
          success: false,
          error: {
            name: 'UpdatePasswordError',
            message: error.message,
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
          name: 'UpdatePasswordError',
          message: e.message || 'Failed to update password',
        },
      }
    }
  },
}
