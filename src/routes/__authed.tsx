import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

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
	return (
		<Layout>
			<Outlet />
		</Layout>
	)
}
