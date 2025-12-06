import { useGo, useTranslate } from '@refinedev/core'
import { Ghost, Home, MapPinOff } from 'lucide-react'

import { Button } from '@/components/ui/button'

/**
 * When the app is navigated to a non-existent route, refine shows a default error page.
 * A custom error component can be used for this error page.
 *
 * @see {@link https://refine.dev/docs/packages/documentation/routers/} for more details.
 */
export function NotFound() {
	const translate = useTranslate()
	const go = useGo()

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center bg-background">
			<div className="relative">
				<Ghost className="size-24 text-muted-foreground animate-pulse" />
				<MapPinOff className="absolute -bottom-2 -right-2 size-8 text-destructive" />
			</div>

			<div className="space-y-2">
				<h1 className="text-4xl font-bold tracking-tight">Lost in the void! 👻</h1>
				<p className="text-xl text-muted-foreground">This page has gone ghost mode.</p>
			</div>

			<div className="max-w-md space-y-2 text-sm text-muted-foreground">
				<p>
					Either this page packed its bags and left, or you've discovered a secret portal to
					nowhere.
				</p>
				<p>Spoiler: It's probably the first one.</p>
			</div>

			<Button className="mt-4 gap-2" onClick={() => go({ to: '/' })} size="lg" variant="outline">
				<Home className="size-4" />
				{translate('pages.error.backHome', 'Beam me home')}
			</Button>

			<p className="text-xs text-muted-foreground/60">
				Error 404 · Page not found · It's not you, it's us (maybe)
			</p>
		</div>
	)
}

NotFound.displayName = 'ErrorComponent'
