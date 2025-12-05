import { matchResourceFromRoute } from '@refinedev/core'
import type { ResourceProps, RouterProvider } from '@refinedev/core'
import {
	Link as TanStackLink,
	useLocation,
	useNavigate,
	useParams,
	useRouter,
	useSearch
} from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import qs from 'qs'
import { forwardRef, useCallback } from 'react'

/**
 * Factory function to create TanStack Router provider for Refine
 * Takes resources as a parameter to avoid global state
 */
export function createRouterBindings(resources: Array<ResourceProps>): RouterProvider {
	// Hook that returns the go function
	const useGo = () => {
		const navigate = useNavigate()
		const location = useLocation()
		const router = useRouter()

		const go = useCallback(
			({
				hash,
				options = {},
				query,
				to,
				type = 'push'
			}: {
				hash?: string
				options?: { keepHash?: boolean; keepQuery?: boolean }
				query?: Record<string, unknown>
				to?: string
				type?: 'path' | 'push' | 'replace'
			}) => {
				const { keepHash, keepQuery } = options

				// Build query string
				let urlQuery = query || {}
				if (keepQuery) {
					const currentSearch = location.search as Record<string, unknown>
					urlQuery = { ...currentSearch, ...query }
				}

				const queryString = Object.keys(urlQuery).length
					? `?${qs.stringify(urlQuery, { encode: false })}`
					: ''

				// Build hash
				const currentHash = location.hash
				const hashString = hash ? `#${hash}` : keepHash && currentHash ? currentHash : ''

				// Build final path
				const targetPath = to || location.pathname
				const fullPath = `${targetPath}${queryString}${hashString}`

				// Return path string or navigate
				if (type === 'path') {
					return fullPath
				}

				// Invalidate router to refetch loaders after navigation
				void router.invalidate()

				navigate({
					replace: type === 'replace',
					to: fullPath
				})
			},
			[navigate, location, router]
		)

		return go
	}

	// Hook that returns the back function
	const useBack = () => {
		const back = useCallback(() => {
			window.history.back()
		}, [])

		return back
	}

	// Hook that returns the parsed route info
	const useParse = () => {
		const params = useParams({ strict: false })
		const location = useLocation()
		const search = useSearch({ strict: false })

		const parse = useCallback(() => {
			// Match resource from route using closure reference
			const { action, resource } = matchResourceFromRoute(location.pathname, resources)

			// Extract ID from params
			const id = (params as Record<string, string>)?.id

			// Parse pagination params
			const current = search?.current ? Number(search.current) : undefined
			const pageSize = search?.pageSize ? Number(search.pageSize) : undefined

			return {
				action,
				id,
				params: {
					...params,
					...search,
					current,
					pageSize
				},
				pathname: location.pathname,
				resource
			}
		}, [params, location, search])

		return parse
	}

	return {
		back: useBack,
		go: useGo,
		Link: ({ ref, ...props }: LinkProps & { ref?: React.RefObject<HTMLAnchorElement | null> }) => {
			return <TanStackLink {...props} ref={ref} />
		},
		parse: useParse
	}
}
