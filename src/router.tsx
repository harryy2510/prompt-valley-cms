import { createRouter } from '@tanstack/react-router'

import { DefaultCatchBoundary } from '@/components/default-catch-boundary'
import { ErrorComponent } from '@/components/refine-ui/layout/error-component'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export function getRouter() {
	return createRouter({
		context: {
			session: null
		},
		defaultErrorComponent: DefaultCatchBoundary,
		defaultHashScrollIntoView: { behavior: 'smooth' },
		defaultNotFoundComponent: () => <ErrorComponent />,
		defaultPreload: 'intent',
		routeTree,
		scrollRestoration: true
	})
}
