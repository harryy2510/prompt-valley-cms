import { useMemo } from 'react'
import { useTable } from '@refinedev/react-table'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { useDelete, useNavigation, useSelect } from '@refinedev/core'
import {
  ListView,
  ListViewHeader,
} from '@/components/refine-ui/views/list-view'
import { DataTable } from '@/components/refine-ui/data-table/data-table'
import { DataTableSorter } from '@/components/refine-ui/data-table/data-table-sorter'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ActionButton } from '@/components/ui/action-button'
import { Tables } from '@/types/database.types'
import { startCase } from 'lodash-es'
import { DataTableFilterCombobox } from '@/components/refine-ui/data-table/data-table-filter'
import { useLocalStorage } from 'usehooks-ts'
import dayjs from 'dayjs'
import { fCurrency, fShortenNumber } from '@/utils/format'

type AiModel = Tables<'ai_models'> & {
  ai_providers: Pick<Tables<'ai_providers'>, 'id' | 'name'>
  prompt_models: { count: number }[]
}

const STORAGE_KEY = 'ai-models-column-visibility'

export function AiModelsList() {
  const { edit } = useNavigation()
  const { mutateAsync: deleteModel } = useDelete()
  const [columnVisibility, setColumnVisibility] =
    useLocalStorage<VisibilityState>(STORAGE_KEY, {})

  // Fetch providers for filter dropdown
  const { options: providerOptions } = useSelect<Tables<'ai_providers'>>({
    resource: 'ai_providers',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 1000 },
  })

  const columns = useMemo<ColumnDef<AiModel>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column, table }) => (
          <div className="flex items-center gap-1">
            <span>Model</span>
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
        id: 'provider_id',
        accessorKey: 'provider_id',
        header: ({ column, table }) => (
          <div className="flex items-center gap-1">
            <span>Provider</span>
            <DataTableSorter column={column} />
            <DataTableFilterCombobox
              column={column}
              options={providerOptions}
              table={table}
              operators={['eq']}
              defaultOperator="eq"
            />
          </div>
        ),
        cell: ({ row }) => (
          <>
            <div className="font-medium">{row.original.ai_providers.name}</div>
            <div className="text-xs text-muted-foreground font-mono">
              {row.original.ai_providers.id}
            </div>
          </>
        ),
      },
      {
        id: 'capabilities',
        accessorKey: 'capabilities',
        header: 'Capabilities',
        enableSorting: false,
        cell: ({ getValue }) => {
          const caps = getValue() as string[]
          if (!caps?.length) {
            return <span className="text-muted-foreground">—</span>
          }
          return (
            <div className="flex flex-wrap gap-1">
              {caps.map((cap) => (
                <Badge key={cap} variant="outline" className="text-xs">
                  {startCase(cap)}
                </Badge>
              ))}
            </div>
          )
        },
      },
      {
        id: 'context_window',
        accessorKey: 'context_window',
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>Context Window</span>
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ getValue }) => {
          const value = getValue() as number | null
          if (!value) return <span className="text-muted-foreground">—</span>
          return (
            <span className="text-sm tabular-nums">
              {fShortenNumber(value)}
            </span>
          )
        },
      },
      {
        id: 'max_output_tokens',
        accessorKey: 'max_output_tokens',
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>Max Output</span>
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ getValue }) => {
          const value = getValue() as number | null
          if (!value) return <span className="text-muted-foreground">—</span>
          return (
            <span className="text-sm tabular-nums">
              {fShortenNumber(value)}
            </span>
          )
        },
      },
      {
        id: 'cost',
        header: 'Cost / 1M tokens',
        enableSorting: false,
        cell: ({ row }) => {
          const input = row.original.cost_input_per_million
          const output = row.original.cost_output_per_million
          if (!input && !output) {
            return <span className="text-muted-foreground">—</span>
          }
          return (
            <div className="text-sm tabular-nums">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">In:</span>
                <span>{input ? fCurrency(input) : '—'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">Out:</span>
                <span>{output ? fCurrency(output) : '—'}</span>
              </div>
            </div>
          )
        },
      },
      {
        id: 'prompts',
        header: 'Prompts',
        enableSorting: false,
        cell: ({ row }) => {
          const count = row.original.prompt_models?.[0]?.count ?? 0
          if (count === 0) {
            return <span className="text-muted-foreground">0 prompts</span>
          }
          const filterParams = new URLSearchParams({
            'filters[0][field]': 'model_id',
            'filters[0][operator]': 'eq',
            'filters[0][value]': row.original.id,
          })
          return (
            <Link
              to={`/prompts?${filterParams.toString()}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {fShortenNumber(count)} {count === 1 ? 'prompt' : 'prompts'}
            </Link>
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
              onClick={() => edit('ai_models', row.original.id)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <ActionButton
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              requireAreYouSure
              areYouSureTitle="Delete AI Model?"
              areYouSureDescription={
                <>
                  This will permanently delete the model "{row.original.name}".
                  This action cannot be undone.
                </>
              }
              confirmLabel="Delete"
              action={async () => {
                await deleteModel({
                  resource: 'ai_models',
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
    [edit, deleteModel, providerOptions],
  )

  const table = useTable<AiModel>({
    enableMultiSort: false,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    refineCoreProps: {
      resource: 'ai_models',
      meta: {
        select: '*, ai_providers(id, name), prompt_models(count)',
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
