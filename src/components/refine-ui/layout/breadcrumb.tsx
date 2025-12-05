import { matchResourceFromRoute, useBreadcrumb, useLink, useResourceParams } from '@refinedev/core'
import { Home } from 'lucide-react'
import { Fragment, useMemo } from 'react'

import {
	Breadcrumb as ShadcnBreadcrumb,
	BreadcrumbItem as ShadcnBreadcrumbItem,
	BreadcrumbList as ShadcnBreadcrumbList,
	BreadcrumbPage as ShadcnBreadcrumbPage,
	BreadcrumbSeparator as ShadcnBreadcrumbSeparator
} from '@/components/ui/breadcrumb'

export function Breadcrumb() {
	const Link = useLink()
	const { breadcrumbs } = useBreadcrumb()
	const { resources } = useResourceParams()
	const rootRouteResource = matchResourceFromRoute('/', resources)

	const breadCrumbItems = useMemo(() => {
		const list: Array<{
			Component: React.ReactNode
			href: string
			key: string
		}> = []

		list.push({
			Component: (
				<Link to={rootRouteResource.matchedRoute ?? '/'}>
					{rootRouteResource?.resource?.meta?.icon ?? <Home className="h-4 w-4" />}
				</Link>
			),
			href: rootRouteResource.matchedRoute ?? '/',
			key: 'breadcrumb-item-home'
		})

		for (const { href, label } of breadcrumbs) {
			list.push({
				Component: href ? <Link to={href}>{label}</Link> : <span>{label}</span>,
				href: href ?? '',
				key: `breadcrumb-item-${label}`
			})
		}

		return list
	}, [breadcrumbs, Link, rootRouteResource])

	return (
		<ShadcnBreadcrumb>
			<ShadcnBreadcrumbList>
				{breadCrumbItems.map((item, index) => {
					if (index === breadCrumbItems.length - 1) {
						return <ShadcnBreadcrumbPage key={item.key}>{item.Component}</ShadcnBreadcrumbPage>
					}

					return (
						<Fragment key={item.key}>
							<ShadcnBreadcrumbItem key={item.key}>{item.Component}</ShadcnBreadcrumbItem>
							<ShadcnBreadcrumbSeparator />
						</Fragment>
					)
				})}
			</ShadcnBreadcrumbList>
		</ShadcnBreadcrumb>
	)
}

Breadcrumb.displayName = 'Breadcrumb'
