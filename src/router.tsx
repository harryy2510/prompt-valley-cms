import { createRouter } from '@tanstack/react-router'

import { DefaultCatchBoundary } from '@/components/refine-ui/errors/default-catch-boundary'
import { NotFound } from '@/components/refine-ui/errors/not-found'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export function getRouter() {
	return createRouter({
		context: {
			role: null,
			session: null
		},
		defaultErrorComponent: DefaultCatchBoundary,
		defaultHashScrollIntoView: { behavior: 'smooth' },
		defaultNotFoundComponent: () => <NotFound />,
		defaultPreload: 'intent',
		routeTree,
		scrollRestoration: true
	})
}
