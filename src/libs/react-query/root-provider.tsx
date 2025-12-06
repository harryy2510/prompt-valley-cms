import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { QueryClientConfig } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

const config: QueryClientConfig = {
	defaultOptions: {
		queries: {
			gcTime: Infinity,
			refetchOnMount: false,
			refetchOnWindowFocus: false,
			retry: false,
			staleTime: Infinity
		}
	}
}

export function getContext() {
	const queryClient = new QueryClient(config)
	return { queryClient }
}

export function ReactQueryProvider({
	children,
	queryClient
}: PropsWithChildren<{ queryClient: QueryClient }>) {
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
