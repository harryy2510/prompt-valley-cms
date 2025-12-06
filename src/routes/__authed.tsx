import { createFileRoute, Outlet, redirect, useRouteContext } from '@tanstack/react-router'

import { Forbidden } from '@/components/refine-ui/errors/forbidden'
import { Layout } from '@/components/refine-ui/layout/layout'

// ============================================
// Protected Layout Route
// ============================================

export const Route = createFileRoute('/__authed')({
	beforeLoad: ({ context, location }) => {
		if (!context.session) {
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
	const { role } = useRouteContext({ from: '/__authed' })

	if (role !== 'admin') {
		return <Forbidden />
	}

	return (
		<Layout>
			<Outlet />
		</Layout>
	)
}
