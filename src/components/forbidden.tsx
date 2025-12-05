import { Loader2, ShieldX, LogOut, Coffee } from 'lucide-react'
import { useLogout } from '@refinedev/core'
import { Button } from '@/components/ui/button'

export function Forbidden() {
  const { mutate: logout, isPending } = useLogout()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <div className="relative">
        <ShieldX className="size-24 text-destructive" />
        <Coffee className="absolute -bottom-2 -right-2 size-8 text-muted-foreground animate-bounce" />
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Whoa there, cowboy! 🤠
        </h1>
        <p className="text-xl text-muted-foreground">
          This area is for admins only.
        </p>
      </div>

      <div className="max-w-md space-y-2 text-sm text-muted-foreground">
        <p>
          Looks like you wandered into the VIP section without a backstage pass.
        </p>
        <p>
          Maybe grab a coffee while someone with more buttons on their shirt handles this?
        </p>
      </div>

      <Button
        variant="outline"
        size="lg"
        onClick={() => logout()}
        disabled={isPending}
        className="mt-4 gap-2"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}
        Retreat gracefully
      </Button>

      <p className="text-xs text-muted-foreground/60">
        Error 403 · You shall not pass · The door is that way →
      </p>
    </div>
  )
}
