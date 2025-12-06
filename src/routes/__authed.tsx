import { usePermissions } from '@refinedev/core'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { Forbidden } from '@/components/refine-ui/errors/forbidden'
import { Layout } from '@/components/refine-ui/layout/layout'

// ============================================
// Protected Layout Route
// ============================================

export const Route = createFileRoute('/__authed')({
	beforeLoad: ({ context, location }) => {
		if (!context.identity) {
			throw redirect({
				search: {
					to: location.href
				},
				to: '/auth'
			})
		}
	},
	component: RootComponent
})

function RootComponent() {
	const { data: role, isLoading } = usePermissions({})

	if (isLoading) {
		return null
	}

	if (role !== 'admin') {
		return <Forbidden />
	}

	return (
		<Layout>
			<Outlet />
		</Layout>
	)
}
