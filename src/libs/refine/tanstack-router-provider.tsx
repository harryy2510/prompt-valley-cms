import { forwardRef, useCallback } from 'react'
import {
  useNavigate,
  useParams,
  useLocation,
  useSearch,
  Link as TanStackLink,
  type LinkProps,
  useRouter,
} from '@tanstack/react-router'
import { matchResourceFromRoute, type RouterProvider, type ResourceProps } from '@refinedev/core'
import qs from 'qs'

/**
 * Factory function to create TanStack Router provider for Refine
 * Takes resources as a parameter to avoid global state
 */
export function createRouterBindings(resources: ResourceProps[]): RouterProvider {
  // Hook that returns the go function
  const useGo = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const router = useRouter()

    const go = useCallback(
      ({
        to,
        query,
        hash,
        options = {},
        type = 'push',
      }: {
        to?: string
        query?: Record<string, unknown>
        hash?: string
        options?: { keepQuery?: boolean; keepHash?: boolean }
        type?: 'push' | 'replace' | 'path'
      }) => {
        const { keepQuery, keepHash } = options

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
        const hashString = hash
          ? `#${hash}`
          : keepHash && currentHash
            ? currentHash
            : ''

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
          to: fullPath,
          replace: type === 'replace',
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
    const search = useSearch({ strict: false }) as Record<string, unknown>

    const parse = useCallback(() => {
      // Match resource from route using closure reference
      const { resource, action } = matchResourceFromRoute(location.pathname, resources)

      // Extract ID from params
      const id = (params as Record<string, string>)?.id

      // Parse pagination params
      const current = search?.current ? Number(search.current) : undefined
      const pageSize = search?.pageSize ? Number(search.pageSize) : undefined

      return {
        resource,
        action,
        id,
        pathname: location.pathname,
        params: {
          ...params,
          ...search,
          current,
          pageSize,
        },
      }
    }, [params, location, search])

    return parse
  }

  return {
    go: useGo,
    back: useBack,
    parse: useParse,
    Link: forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
      return <TanStackLink {...props} ref={ref} />
    }),
  }
}
