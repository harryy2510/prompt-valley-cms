import { useGo, useIsAuthenticated, useParsed, usePermissions } from '@refinedev/core'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'

import { Forbidden } from '@/components/forbidden'

type AuthGuardMode = 'guest' | 'protected'

type AuthGuardProps = {
	children: ReactNode
	/** Custom loading component */
	fallback?: ReactNode
	/**
	 * 'protected' - requires authentication, redirects to login if not authenticated
	 * 'guest' - for login/register pages, redirects to app if already authenticated
	 */
	mode?: AuthGuardMode
	/** Custom redirect path (defaults: '/login' for protected, '/' for guest) */
	redirectTo?: string
}

const DefaultFallback = () => (
	<div className="flex min-h-screen items-center justify-center">
		<Loader2 className="size-8 animate-spin text-muted-foreground" />
	</div>
)

export function AuthGuard({
	children,
	fallback = <DefaultFallback />,
	mode = 'protected',
	redirectTo
}: AuthGuardProps) {
	const { params, pathname } = useParsed()
	const go = useGo()
	const { data, isLoading } = useIsAuthenticated()
	const { data: role, isLoading: isLoadingPermissions } = usePermissions({})

	const isAuthenticated = data?.authenticated ?? false

	// Handle redirects via useEffect
	useEffect(() => {
		if (isLoading || isLoadingPermissions) return

		if (mode === 'protected' && !isAuthenticated) {
			go({
				query: { redirect: pathname || '/' },
				to: redirectTo ?? '/login',
				type: 'replace'
			})
		}

		if (mode === 'guest' && isAuthenticated) {
			const searchParams = params as { redirect?: string }
			go({
				to: redirectTo ?? searchParams?.redirect ?? '/',
				type: 'replace'
			})
		}
	}, [isLoading, isLoadingPermissions, isAuthenticated, mode, go, pathname, params, redirectTo])

	if (isLoading || isLoadingPermissions) return fallback

	// If we should redirect, show fallback while redirect happens
	if (mode === 'protected' && !isAuthenticated) {
		return fallback
	}

	if (mode === 'guest' && isAuthenticated) {
		return fallback
	}

	if (mode === 'protected' && role !== 'admin') {
		return <Forbidden />
	}

	return <>{children}</>
}
