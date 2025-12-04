import { useTable } from '@refinedev/react-table'
import { type ColumnDef } from '@tanstack/react-table'
import { useState, useMemo } from 'react'
import { Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { useDelete, useNavigation } from '@refinedev/core'

import { ListView, ListViewHeader } from '@/components/refine-ui/views/list-view'
import { DataTable } from '@/components/refine-ui/data-table/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type AiModel = {
  id: string
  name: string
  provider_id: string
  capabilities: string[]
  context_window: number | null
  cost_input_per_million: number | null
  cost_output_per_million: number | null
  max_output_tokens: number | null
  created_at: string
  updated_at: string
}

export function AiModelsList() {
  const { edit } = useNavigation()
  const { mutate: deleteModel } = useDelete()
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    id: string
    name: string
  } | null>(null)

  const columns = useMemo<ColumnDef<AiModel>[]>(
    () => [
      {
        id: 'name',
        header: 'Model',
        accessorKey: 'name',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.provider_id}
            </div>
          </div>
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
                  {cap}
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
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => edit('ai_models', row.original.id)}
                >
                  <Pencil className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() =>
                    setDeleteDialog({
                      open: true,
                      id: row.original.id,
                      name: row.original.name,
                    })
                  }
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
    },
  })

  const handleDelete = () => {
    if (!deleteDialog) return
    deleteModel(
      {
        resource: 'ai_models',
        id: deleteDialog.id,
      },
      {
        onSuccess: () => {
          setDeleteDialog(null)
        },
      },
    )
  }

  return (
    <ListView>
      <ListViewHeader />
      <DataTable table={table} />

      <AlertDialog open={deleteDialog?.open} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the model "{deleteDialog?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ListView>
  )
}
