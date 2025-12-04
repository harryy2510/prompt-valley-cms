import { AuthProvider } from '@refinedev/core'
import { supabase } from './supabase'

export const authProvider: AuthProvider = {
  login: async ({ email, otp, providerName }) => {
    try {
      if (providerName === 'google') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
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
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo: window.location.origin,
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

      if (!otp) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
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

      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
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
