import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import qs from 'qs'
import type { ReactNode } from 'react'

import { DefaultCatchBoundary } from '@/components/refine-ui/errors/default-catch-boundary'
import { NotFound } from '@/components/refine-ui/errors/not-found'
import { getContext, ReactQueryProvider } from '@/libs/react-query/root-provider'
import { stringifyConfig } from '@/libs/refine/tanstack-router-provider'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export function getRouter() {
	const rqContext = getContext()

	const router = createRouter({
		context: {
			...rqContext,
			identity: null,
			permissions: null
		},
		defaultErrorComponent: DefaultCatchBoundary,
		defaultHashScrollIntoView: { behavior: 'smooth' },
		defaultNotFoundComponent: () => <NotFound />,
		defaultPreload: 'intent',
		parseSearch: (search) => qs.parse(search, { ignoreQueryPrefix: true }),
		routeTree,
		scrollRestoration: true,
		stringifySearch: (search) => qs.stringify(search, stringifyConfig),
		Wrap: (props: { children: ReactNode }) => {
			return <ReactQueryProvider {...rqContext}>{props.children}</ReactQueryProvider>
		}
	})

	setupRouterSsrQueryIntegration({ queryClient: rqContext.queryClient, router })

	return router
}
