import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface PageHeaderProps {
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between space-y-4 border-b py-6 md:flex-row md:items-center md:space-x-10 md:space-y-0">
      <div className="max-w-lg space-y-0.5">
        <h2 className="text-2xl font-medium">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {action && (
        <div className="flex items-center space-x-2 md:flex-row-reverse md:space-x-reverse">
          <Button onClick={action.onClick} size="sm" className="gap-2">
            <Plus className="size-4 stroke-2" />
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}

interface DataTableWrapperProps {
  children: ReactNode
  isLoading?: boolean
}

export function DataTableWrapper({ children, isLoading }: DataTableWrapperProps) {
  if (isLoading) {
    return (
      <div className="mt-6 overflow-hidden rounded border bg-background">
        <div className="h-96 animate-pulse bg-muted" />
      </div>
    )
  }

  return (
    <div className="mt-6 overflow-hidden rounded border bg-background">
      {children}
    </div>
  )
}

interface FormCardProps {
  title: string
  description: string
  children: ReactNode
}

export function FormCard({ title, description, children }: FormCardProps) {
  return (
    <div className="w-full divide-y overflow-hidden rounded border bg-background">
      <div className="p-4">
          <h4 className="text-lg font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </div>
  )
}

interface FormPageLayoutProps {
  title: string
  description: string
  children: ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl"
  isLoading?: boolean
}

export function FormPageLayout({
  title,
  description,
  children,
  maxWidth = "2xl",
  isLoading
}: FormPageLayoutProps) {
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[maxWidth]

  if (isLoading) {
    return (
      <div className="mx-auto w-full" style={{ maxWidth: maxWidthClass.replace("max-w-", "") }}>
        <div className="flex flex-col justify-between space-y-4 border-b py-6">
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className={`mx-auto w-full ${maxWidthClass}`}>
      <div className="flex flex-col justify-between space-y-4 border-b py-6">
        <div className="max-w-lg space-y-0.5">
            <h2 className="text-2xl font-medium">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  )
}
