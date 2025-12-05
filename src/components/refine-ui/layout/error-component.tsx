import { useEffect, useState } from 'react'
import { useGo, useResourceParams } from '@refinedev/core'
import { useTranslate } from '@refinedev/core'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Home, InfoIcon, Ghost, MapPinOff } from 'lucide-react'

/**
 * When the app is navigated to a non-existent route, refine shows a default error page.
 * A custom error component can be used for this error page.
 *
 * @see {@link https://refine.dev/docs/packages/documentation/routers/} for more details.
 */
export function ErrorComponent() {
  const [errorMessage, setErrorMessage] = useState<string>()

  const translate = useTranslate()
  const go = useGo()

  const { resource, action } = useResourceParams()

  useEffect(() => {
    if (resource && action) {
      setErrorMessage(
        translate(
          'pages.error.info',
          {
            action: action,
            resource: resource?.name,
          },
          `You may have forgotten to add the "${action}" component to "${resource?.name}" resource.`,
        ),
      )
    }
  }, [resource, action, translate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center bg-background">
      <div className="relative">
        <Ghost className="size-24 text-muted-foreground animate-pulse" />
        <MapPinOff className="absolute -bottom-2 -right-2 size-8 text-destructive" />
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Lost in the void! 👻
        </h1>
        <p className="text-xl text-muted-foreground">
          {translate('pages.error.title', 'This page has gone ghost mode.')}
        </p>
      </div>

      <div className="max-w-md space-y-2 text-sm text-muted-foreground">
        <p>
          Either this page packed its bags and left, or you've discovered a
          secret portal to nowhere.
        </p>
        <p>Spoiler: It's probably the first one.</p>
        {errorMessage && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="inline-flex items-center gap-1 cursor-help text-xs text-muted-foreground/70">
                  <InfoIcon className="size-3" />
                  Dev hint available
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{errorMessage}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <Button
        variant="outline"
        size="lg"
        onClick={() => go({ to: '/' })}
        className="mt-4 gap-2"
      >
        <Home className="size-4" />
        {translate('pages.error.backHome', 'Beam me home')}
      </Button>

      <p className="text-xs text-muted-foreground/60">
        Error 404 · Page not found · It's not you, it's us (maybe)
      </p>
    </div>
  )
}

ErrorComponent.displayName = 'ErrorComponent'
