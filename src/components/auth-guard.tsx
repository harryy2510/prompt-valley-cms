import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useIsAuthenticated } from '@refinedev/core'

type AuthGuardMode = 'protected' | 'guest'

interface AuthGuardProps {
  children: ReactNode
  /**
   * 'protected' - requires authentication, redirects to login if not authenticated
   * 'guest' - for login/register pages, redirects to app if already authenticated
   */
  mode?: AuthGuardMode
  /** Custom redirect path (defaults: '/login' for protected, '/' for guest) */
  redirectTo?: string
  /** Custom loading component */
  fallback?: ReactNode
}

const DefaultFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="size-8 animate-spin text-muted-foreground" />
  </div>
)

export function AuthGuard({
  children,
  mode = 'protected',
  redirectTo,
  fallback = <DefaultFallback />,
}: AuthGuardProps) {
  const location = useLocation()
  const { data, isLoading } = useIsAuthenticated()

  if (isLoading) return fallback

  const isAuthenticated = data?.authenticated ?? false

  if (mode === 'protected' && !isAuthenticated) {
    return (
      <Navigate
        to={redirectTo ?? '/login'}
        state={{ from: location.pathname }}
        replace
      />
    )
  }

  if (mode === 'guest' && isAuthenticated) {
    const from = (location.state as { from?: string })?.from
    return <Navigate to={redirectTo ?? from ?? '/'} replace />
  }

  return <>{children}</>
}
