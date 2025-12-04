import { useTable } from '@refinedev/react-table'
import { type ColumnDef } from '@tanstack/react-table'
import { useState, useMemo } from 'react'
import { ExternalLink, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
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
import { getImageUrl } from '@/libs/storage'

type AiProvider = {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  created_at: string
  updated_at: string
}

export function AiProvidersList() {
  const { edit } = useNavigation()
  const { mutate: deleteProvider } = useDelete()
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    id: string
    name: string
  } | null>(null)

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
        size: 60,
      },
      {
        id: 'name',
        header: 'Provider',
        accessorKey: 'name',
        cell: ({ getValue }) => (
          <div className="font-medium">{getValue() as string}</div>
        ),
      },
      {
        id: 'website',
        header: 'Website',
        accessorKey: 'website_url',
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
            <span className="text-sm text-muted-foreground">—</span>
          )
        },
        enableSorting: false,
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
                  onClick={() => edit('ai_providers', row.original.id)}
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

  const table = useTable<AiProvider>({
    columns,
    refineCoreProps: {
      resource: 'ai_providers',
    },
  })

  const handleDelete = () => {
    if (!deleteDialog) return
    deleteProvider(
      {
        resource: 'ai_providers',
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog?.open} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the provider "{deleteDialog?.name}".
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
