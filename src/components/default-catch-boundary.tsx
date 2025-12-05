import { ErrorComponent, Link, rootRouteId, useMatch, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { Bug, ArrowLeft, Home, RefreshCw, Skull } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
	const router = useRouter()
	const isRoot = useMatch({
		select: (state) => state.id === rootRouteId,
		strict: false
	})

	console.error(error)

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
			<div className="relative">
				<Bug className="size-24 text-destructive" />
				<Skull className="absolute -bottom-2 -right-2 size-8 text-muted-foreground animate-bounce" />
			</div>

			<div className="space-y-2">
				<h1 className="text-4xl font-bold tracking-tight">Well, this is awkward...</h1>
				<p className="text-xl text-muted-foreground">Something broke. Classic.</p>
			</div>

			<div className="max-w-md space-y-2 text-sm text-muted-foreground">
				<p>A wild bug appeared! It used "crash" and it was super effective.</p>
				<p>Don't panic. Our code monkeys have been notified (they're probably on coffee break).</p>
			</div>

			{/* Error Details */}
			<div className="w-full max-w-lg rounded-lg bg-muted/50 p-4 max-h-32 overflow-auto text-left">
				<ErrorComponent error={error} />
			</div>

			{/* Action Buttons */}
			<div className="flex flex-wrap gap-3 justify-center">
				<Button onClick={() => router.invalidate()} size="lg" variant="default" className="gap-2">
					<RefreshCw className="size-4" />
					Smash that retry button
				</Button>

				{isRoot ? (
					<Button asChild size="lg" variant="outline" className="gap-2">
						<Link to="/">
							<Home className="size-4" />
							Take me home
						</Link>
					</Button>
				) : (
					<Button onClick={() => window.history.back()} size="lg" variant="outline" className="gap-2">
						<ArrowLeft className="size-4" />
						Nope, go back
					</Button>
				)}
			</div>

			<p className="text-xs text-muted-foreground/60">
				Error timestamp: {new Date().toLocaleString()} · Have you tried turning it off and on again?
			</p>
		</div>
	)
}
