import { useTable } from '@refinedev/react-table'
import { type ColumnDef } from '@tanstack/react-table'
import { useState, useMemo } from 'react'
import { Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { useDelete, useNavigation } from '@refinedev/core'

import { ListView, ListViewHeader } from '@/components/refine-ui/views/list-view'
import { DataTable } from '@/components/refine-ui/data-table/data-table'
import { Button } from '@/components/ui/button'
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

type Category = {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export function CategoriesList() {
  const { edit } = useNavigation()
  const { mutate: deleteCategory } = useDelete()
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    id: string
    name: string
  } | null>(null)

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessorKey: 'name',
        cell: ({ getValue }) => (
          <div className="font-medium">{getValue() as string}</div>
        ),
      },
      {
        id: 'id',
        header: 'ID',
        accessorKey: 'id',
        cell: ({ getValue }) => (
          <span className="text-sm font-mono text-muted-foreground">
            {getValue() as string}
          </span>
        ),
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
                  onClick={() => edit('categories', row.original.id)}
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

  const table = useTable<Category>({
    columns,
    refineCoreProps: {
      resource: 'categories',
    },
  })

  const handleDelete = () => {
    if (!deleteDialog) return
    deleteCategory(
      {
        resource: 'categories',
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
              This will permanently delete the category "{deleteDialog?.name}".
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
