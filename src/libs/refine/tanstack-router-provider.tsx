/* eslint-disable react-hooks/rules-of-hooks */
import type { GoConfig, ParseResponse, RouterProvider } from '@refinedev/core'
import { matchResourceFromRoute, ResourceContext } from '@refinedev/core'
import {
	Link as TanStackLink,
	useLocation,
	useNavigate,
	useParams,
	useRouter,
	useSearch
} from '@tanstack/react-router'
import qs from 'qs'
import type { ComponentProps } from 'react'
import React, { use, useCallback } from 'react'
import { parseQuery, parseURL } from 'ufo'

/**
 * qs stringify config matching Refine's React Router provider
 */
export const stringifyConfig = {
	addQueryPrefix: true,
	arrayFormat: 'indices' as const,
	encode: false,
	encodeValuesOnly: true,
	skipNulls: true
}

/**
 * Factory function to create TanStack Router provider for Refine
 * Takes resources as a parameter to avoid global state
 */
export const routerProvider: RouterProvider = {
	// Hook that returns the back function
	back: () => {
		const router = useRouter()

		return useCallback(() => {
			router.history.back()
		}, [router])
	},

	// Hook that returns the go function
	go: () => {
		const location = useLocation()
		const navigate = useNavigate()

		return useCallback(
			({ hash, options: { keepHash, keepQuery } = {}, query, to, type }: GoConfig) => {
				let urlHash = ''

				if (keepHash && typeof document !== 'undefined') {
					urlHash = document.location.hash
				}

				if (hash) {
					urlHash = `#${hash.replace(/^#/, '')}`
				}

				const urlQuery = {
					...(keepQuery ? location.search : {}),
					...query
				}

				if (urlQuery.to) {
					urlQuery.to = encodeURIComponent(`${urlQuery.to}`)
				}

				const cleanPathname = location.pathname.split('?')[0].split('#')[0] ?? ''

				const urlTo = to || cleanPathname

				const hasUrlHash = urlHash.length > 1
				const hasUrlQuery = Object.keys(urlQuery).length > 0

				const fullPath = `${urlTo}${hasUrlQuery ? qs.stringify(urlQuery, stringifyConfig) : ''}${hasUrlHash ? urlHash : ''}`

				if (type === 'path') {
					return fullPath
				}

				// Navigate to the url
				void navigate({
					hash: hasUrlHash ? urlHash : '',
					replace: type === 'replace',
					search: urlQuery,
					to: urlTo
				})

				return undefined
			},
			[location, navigate]
		)
	},

	Link: function RefineLink({
		ref,
		to,
		...props
	}: ComponentProps<NonNullable<RouterProvider['Link']>> & {
		ref?: React.RefObject<HTMLAnchorElement | null>
	}) {
		const parsed = parseURL(to)
		if (parsed.host) {
			return <a href={to} {...props} ref={ref} />
		}
		const query = parseQuery(parsed.search)
		return <TanStackLink hash={parsed.hash} search={query} to={to} {...props} ref={ref} />
	},

	// Hook that returns the parsed route info
	parse: () => {
		const params = useParams({ strict: false })
		const location = useLocation()
		const search = useSearch({ strict: false })
		const { resources } = use(ResourceContext)

		return useCallback(() => {
			// Match resource from route using closure reference
			const { action, resource } = matchResourceFromRoute(location.pathname, resources)

			const combinedParams: Record<string, unknown> = {
				...params,
				...search
			}

			const response: ParseResponse = {
				...(resource && { resource }),
				...(action && { action }),
				...(params?.id && { id: decodeURIComponent(params.id) }),
				params: {
					...combinedParams,
					currentPage: convertToNumberIfPossible(combinedParams.currentPage as string),
					pageSize: convertToNumberIfPossible(combinedParams.pageSize as string),
					to: combinedParams.to ? decodeURIComponent(combinedParams.to as string) : undefined
				},
				pathname: location.pathname
			}

			return response
		}, [location.pathname, resources, params, search])
	}
}

/**
 * Convert string to number if possible
 */
function convertToNumberIfPossible(value: string | undefined): number | undefined {
	if (value === undefined) return undefined
	const num = Number(value)
	return isNaN(num) ? undefined : num
}
