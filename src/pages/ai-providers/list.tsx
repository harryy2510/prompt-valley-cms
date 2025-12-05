import { useMemo } from 'react'
import { useTable } from '@refinedev/react-table'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { useDelete, useNavigation } from '@refinedev/core'
import { useLocalStorage } from 'usehooks-ts'
import { Link } from 'react-router'
import dayjs from 'dayjs'

import {
  ListView,
  ListViewHeader,
} from '@/components/refine-ui/views/list-view'
import { DataTable } from '@/components/refine-ui/data-table/data-table'
import { DataTableSorter } from '@/components/refine-ui/data-table/data-table-sorter'
import { Button } from '@/components/ui/button'
import { ActionButton } from '@/components/ui/action-button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tables } from '@/types/database.types'
import { getImageUrl } from '@/libs/storage'

type AiProvider = Tables<'ai_providers'> & {
  ai_models: Pick<Tables<'ai_models'>, 'id' | 'name'>[]
}

const STORAGE_KEY = 'ai-providers-column-visibility'

export function AiProvidersList() {
  const { edit } = useNavigation()
  const { mutateAsync: deleteProvider } = useDelete()
  const [columnVisibility, setColumnVisibility] =
    useLocalStorage<VisibilityState>(STORAGE_KEY, {})

  const columns = useMemo<ColumnDef<AiProvider>[]>(
    () => [
      {
        id: 'logo',
        header: '',
        accessorKey: 'logo_url',
        cell: ({ row }) => {
          const logoUrl = getImageUrl(row.original.logo_url)
          return logoUrl ? (
            <img
              src={logoUrl}
              alt={row.original.name}
              className="size-8 rounded border object-contain p-1"
            />
          ) : (
            <div className="flex size-8 items-center justify-center rounded border bg-muted text-xs font-medium">
              {row.original.name.charAt(0)}
            </div>
          )
        },
        enableSorting: false,
        enableHiding: false,
        size: 60,
      },
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>Provider</span>
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ row }) => (
          <>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground font-mono">
              {row.original.id}
            </div>
          </>
        ),
      },
      {
        id: 'models',
        header: 'Models',
        enableSorting: false,
        cell: ({ row }) => {
          const models = row.original.ai_models ?? []
          const count = models.length
          if (count === 0) {
            return <span className="text-muted-foreground">—</span>
          }
          const filterParams = new URLSearchParams({
            'filters[0][field]': 'provider_id',
            'filters[0][operator]': 'eq',
            'filters[0][value]': row.original.id,
          })
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={`/ai-models?${filterParams.toString()}`}
                  className="text-sm text-primary hover:underline"
                >
                  {count} {count === 1 ? 'model' : 'models'}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-64">
                <ul className="text-xs">
                  {models.map((model) => (
                    <li key={model.id}>{model.name}</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          )
        },
      },
      {
        id: 'website_url',
        accessorKey: 'website_url',
        header: 'Website',
        enableSorting: false,
        cell: ({ getValue }) => {
          const url = getValue() as string | null
          return url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="size-3" />
              <span>Visit site</span>
            </a>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
      },
      {
        id: 'created_at',
        accessorKey: 'created_at',
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>Created</span>
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ getValue }) => {
          const value = getValue() as string
          return (
            <span className="text-sm text-muted-foreground">
              {dayjs(value).format('DD MMM, YYYY')}
            </span>
          )
        },
      },
      {
        id: 'updated_at',
        accessorKey: 'updated_at',
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>Updated</span>
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ getValue }) => {
          const value = getValue() as string
          return (
            <span className="text-sm text-muted-foreground">
              {dayjs(value).format('DD MMM, YYYY')}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        size: 80,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => edit('ai_providers', row.original.id)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <ActionButton
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              requireAreYouSure
              areYouSureTitle="Delete AI Provider?"
              areYouSureDescription={
                <>
                  This will permanently delete the provider "{row.original.name}
                  ". This action cannot be undone.
                </>
              }
              confirmLabel="Delete"
              action={async () => {
                await deleteProvider({
                  resource: 'ai_providers',
                  id: row.original.id,
                })
                return { error: false }
              }}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Delete</span>
            </ActionButton>
          </div>
        ),
      },
    ],
    [edit, deleteProvider],
  )

  const table = useTable<AiProvider>({
    enableMultiSort: false,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    refineCoreProps: {
      resource: 'ai_providers',
      meta: {
        select: '*, ai_models(id, name)',
      },
      sorters: {
        initial: [{ field: 'created_at', order: 'desc' }],
      },
    },
  })

  return (
    <ListView>
      <ListViewHeader table={table} />
      <DataTable table={table} />
    </ListView>
  )
}
