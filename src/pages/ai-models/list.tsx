import { useTable } from '@refinedev/react-table'
import { type ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useDelete, useNavigation } from '@refinedev/core'
import {
  ListView,
  ListViewHeader,
} from '@/components/refine-ui/views/list-view'
import { DataTable } from '@/components/refine-ui/data-table/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ActionButton } from '@/components/ui/action-button'
import { Tables } from '@/types/database.types'
import { startCase } from 'lodash-es'

type AiModel = Tables<'ai_models'> & {
  ai_providers: Pick<Tables<'ai_providers'>, 'name'>
}

export function AiModelsList() {
  const { edit } = useNavigation()
  const { mutateAsync: deleteModel } = useDelete()

  // capabilities: Database["public"]["Enums"]["model_capability"][]
  // context_window: number | null
  // cost_input_per_million: number | null
  // cost_output_per_million: number | null
  // created_at: string
  // id: string
  // max_output_tokens: number | null
  // name: string
  // provider_id: string
  // updated_at: string

  const columns = useMemo<ColumnDef<AiModel>[]>(
    () => [
      {
        id: 'name',
        header: 'Model',
        accessorKey: 'name',
        cell: ({ row }) => (
          <>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.id}
            </div>
          </>
        ),
      },
      {
        id: 'provider',
        header: 'Provider',
        accessorKey: 'name',
        cell: ({ row }) => (
          <>
            <div className="font-medium">{row.original.ai_providers.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.provider_id}
            </div>
          </>
        ),
      },
      {
        id: 'capabilities',
        header: 'Capabilities',
        accessorKey: 'capabilities',
        cell: ({ getValue }) => {
          const caps = getValue() as string[]
          return (
            <div className="flex flex-wrap gap-1">
              {caps?.map((cap) => (
                <Badge key={cap} variant="outline" className="text-xs">
                  {startCase(cap)}
                </Badge>
              ))}
            </div>
          )
        },
        enableSorting: false,
      },
      {
        id: 'context_window',
        header: 'Context',
        accessorKey: 'context_window',
        cell: ({ getValue }) => {
          const value = getValue() as number | null
          return value ? (
            <span className="text-sm">{value.toLocaleString()} tokens</span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )
        },
      },
      {
        id: 'actions',
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
                return {
                  error: false,
                }
              }}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Delete</span>
            </ActionButton>
          </div>
        ),
        enableSorting: false,
        size: 80,
      },
    ],
    [edit],
  )

  const table = useTable<AiModel>({
    columns,
    refineCoreProps: {
      resource: 'ai_models',
      meta: {
        select: '*, ai_providers(id, name)',
      },
    },
  })

  return (
    <ListView>
      <ListViewHeader />
      <DataTable table={table} />
    </ListView>
  )
}
