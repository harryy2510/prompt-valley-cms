import '@fontsource-variable/space-grotesk/index.css'

import { Refine } from '@refinedev/core'
import type { Session } from '@supabase/supabase-js'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import type { PropsWithChildren } from 'react'

import { fetchSessionServer, getUserServer } from '@/actions/auth'
import { LogoWithText } from '@/components/logo-with-text'
import { notificationProvider } from '@/components/refine-ui/notification/notification-provider'
import { Toaster } from '@/components/refine-ui/notification/toaster'
import { ThemeProvider } from '@/components/refine-ui/theme/theme-provider'
import { authProvider } from '@/libs/auth-provider'
import TanStackQueryDevtools from '@/libs/react-query/query-devtools'
import TanStackRouterDevtools from '@/libs/react-query/router-devtools'
import { resources } from '@/libs/refine/resources'
import { serverDataProvider } from '@/libs/refine/server-data-provider'
import { routerProvider } from '@/libs/refine/tanstack-router-provider'
import { seo } from '@/utils/seo'

import appCss from '../tailwind.css?url'

// ============================================
// Router Context Type
// ============================================

export type RouterContext = {
	role: UserRole
	session: null | Session
}

export type UserRole = 'admin' | 'user' | null

// ============================================
// Root Route
// ============================================

export const Route = createRootRouteWithContext<RouterContext>()({
	beforeLoad: async () => {
		const [session, user] = await Promise.all([fetchSessionServer(), getUserServer()])
		const role = (user?.app_metadata?.role as UserRole) || null
		return { role, session }
	},

	component: () => <Outlet />,

	head: () => ({
		links: [
			// Stylesheet
			{
				href: appCss,
				rel: 'stylesheet'
			},
			// Favicon
			{
				href: '/favicon.svg',
				rel: 'icon',
				type: 'image/svg+xml'
			},
			{
				href: '/favicon-96x96.png',
				rel: 'icon',
				sizes: '96x96',
				type: 'image/png'
			},
			{
				href: '/favicon.ico',
				rel: 'icon',
				type: 'image/x-icon'
			},
			// Apple Touch Icon
			{
				href: '/apple-touch-icon.png',
				rel: 'apple-touch-icon',
				sizes: '180x180'
			},
			// Web App Manifest
			{
				href: '/site.webmanifest',
				rel: 'manifest'
			}
		],
		meta: [
			{ charSet: 'utf-8' },
			{ content: 'width=device-width, initial-scale=1', name: 'viewport' },
			// Author & Robots
			{ content: 'Prompt Valley', name: 'author' },
			{ content: 'noindex, nofollow', name: 'robots' },
			// Theme Color
			{ content: '#ffffff', media: '(prefers-color-scheme: light)', name: 'theme-color' },
			{ content: '#09090b', media: '(prefers-color-scheme: dark)', name: 'theme-color' },
			{ content: 'light dark', name: 'color-scheme' },
			// Apple Mobile Web App
			{ content: 'yes', name: 'apple-mobile-web-app-capable' },
			{ content: 'default', name: 'apple-mobile-web-app-status-bar-style' },
			{ content: 'Prompt Valley CMS', name: 'apple-mobile-web-app-title' },
			// Microsoft Tiles
			{ content: '#09090b', name: 'msapplication-TileColor' },
			{ content: '/browserconfig.xml', name: 'msapplication-config' },
			// SEO
			...seo({
				description:
					'Content management system for Prompt Valley. Manage prompts, categories, tags, AI models, and digital assets.',
				keywords: 'prompt valley, cms, content management, ai prompts, admin panel, dashboard',
				title: 'Prompt Valley CMS'
			})
		]
	}),
	shellComponent: RootDocument
})

// ============================================
// Root Document Shell
// ============================================

function RootDocument({ children }: PropsWithChildren) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<Refine
					authProvider={authProvider}
					dataProvider={serverDataProvider}
					notificationProvider={notificationProvider}
					options={{
						disableTelemetry: true,
						mutationMode: 'pessimistic',
						reactQuery: {
							clientConfig: {
								defaultOptions: {
									queries: {
										retry: false
									}
								}
							}
						},
						syncWithLocation: true,
						title: {
							icon: <LogoWithText className="h-8 w-auto" />,
							text: ''
						},
						warnWhenUnsavedChanges: true
					}}
					resources={resources}
					routerProvider={routerProvider}
				>
					<ThemeProvider>
						{children}
						<Toaster />
					</ThemeProvider>
					<TanStackDevtools
						config={{ position: 'bottom-right' }}
						plugins={[TanStackRouterDevtools, TanStackQueryDevtools]}
					/>
				</Refine>
				<Scripts />
			</body>
		</html>
	)
}
