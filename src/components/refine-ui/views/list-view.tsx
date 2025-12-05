import type { PropsWithChildren, ReactNode } from 'react'

import {
  type BaseRecord,
  type HttpError,
  useResourceParams,
  useUserFriendlyName,
} from '@refinedev/core'
import { Breadcrumb } from '@/components/refine-ui/layout/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { CreateButton } from '@/components/refine-ui/buttons/create'
import { cn } from '@/libs/cn'
import { TableColumnButton } from '@/components/table-column-button'
import { UseTableReturnType } from '@refinedev/react-table'

type ListViewProps = PropsWithChildren<{
  className?: string
}>

export function ListView({ children, className }: ListViewProps) {
  return (
    <div className={cn('flex flex-col', 'gap-4', className)}>{children}</div>
  )
}

type ListHeaderProps<TData extends BaseRecord> = PropsWithChildren<{
  resource?: string
  title?: ReactNode
  action?: ReactNode
  canCreate?: boolean
  headerClassName?: string
  wrapperClassName?: string
  table?: UseTableReturnType<TData, HttpError>
}>

export function ListViewHeader<TData extends BaseRecord>({
  canCreate,
  action,
  resource: resourceFromProps,
  title: titleFromProps,
  wrapperClassName,
  headerClassName,
  table,
}: ListHeaderProps<TData>) {
  const getUserFriendlyName = useUserFriendlyName()

  const { resource, identifier } = useResourceParams({
    resource: resourceFromProps,
  })
  const resourceName = identifier ?? resource?.name

  const isCreateButtonVisible = canCreate ?? !!resource?.create

  const title =
    titleFromProps ??
    resource?.meta?.label ??
    getUserFriendlyName(identifier ?? resource?.name, 'plural')

  return (
    <div className={cn('flex flex-col', 'gap-4', wrapperClassName)}>
      <div className="flex items-center relative gap-2">
        <div className="bg-background z-[2] pr-4">
          <Breadcrumb />
        </div>
        <Separator className={cn('absolute', 'left-0', 'right-0', 'z-[1]')} />
      </div>
      <div className={cn('flex', 'justify-between', 'gap-4', headerClassName)}>
        <h2 className="text-2xl font-bold">{title}</h2>
        {(isCreateButtonVisible || table || action) && (
          <div className="flex items-center gap-2">
            {action}
            {table && <TableColumnButton table={table} />}
            <CreateButton resource={resourceName} />
          </div>
        )}
      </div>
    </div>
  )
}

ListView.displayName = 'ListView'
