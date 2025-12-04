import { useTable } from '@refinedev/react-table'
import { type ColumnDef } from '@tanstack/react-table'
import { useState, useMemo } from 'react'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { useDelete, useNavigation } from '@refinedev/core'

import { ListView, ListViewHeader } from '@/components/refine-ui/views/list-view'
import { DataTable } from '@/components/refine-ui/data-table/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

type Prompt = {
  id: string
  title: string
  description: string | null
  content: string
  category_id: string | null
  categories?: {
    id: string
    name: string
  }
  tier: 'free' | 'pro'
  is_published: boolean
  is_featured: boolean
  views_count: number
  images: string[] | null
  created_at: string
  updated_at: string
}

export function PromptsList() {
  const { edit, show } = useNavigation()
  const { mutate: deletePrompt } = useDelete()
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    id: string
    title: string
  } | null>(null)

  const columns = useMemo<ColumnDef<Prompt>[]>(
    () => [
      {
        id: 'title',
        header: 'Title',
        accessorKey: 'title',
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium">{row.original.title}</div>
            {row.original.description && (
              <div className="text-xs text-muted-foreground line-clamp-1">
                {row.original.description}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'category',
        header: 'Category',
        accessorKey: 'categories.name',
        cell: ({ row }) => {
          const category = row.original.categories
          return <span className="text-sm">{category?.name || '—'}</span>
        },
      },
      {
        id: 'tier',
        header: 'Tier',
        accessorKey: 'tier',
        cell: ({ getValue }) => {
          const tier = getValue() as 'free' | 'pro'
          return (
            <Badge
              variant={tier === 'pro' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {tier}
            </Badge>
          )
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'is_published',
        cell: ({ getValue }) => {
          const isPublished = getValue() as boolean
          return (
            <Badge
              variant={isPublished ? 'default' : 'outline'}
              className={
                isPublished
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                  : ''
              }
            >
              {isPublished ? 'Published' : 'Draft'}
            </Badge>
          )
        },
      },
      {
        id: 'views',
        header: 'Views',
        accessorKey: 'views_count',
        cell: ({ getValue }) => {
          const count = getValue() as number
          return <span className="text-sm tabular-nums">{count || 0}</span>
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => show('prompts', row.original.id)}
            >
              <Eye className="size-4" />
              <span className="sr-only">View</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => edit('prompts', row.original.id)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              onClick={() =>
                setDeleteDialog({
                  open: true,
                  id: row.original.id,
                  title: row.original.title,
                })
              }
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [edit, show],
  )

  const table = useTable<Prompt>({
    columns,
    refineCoreProps: {
      resource: 'prompts',
      meta: {
        select: '*, categories(id, name)',
      },
    },
  })

  const handleDelete = () => {
    if (!deleteDialog) return
    deletePrompt(
      {
        resource: 'prompts',
        id: deleteDialog.id,
      },
      {
        onSuccess: () => {
          table.refineCore.tableQuery.refetch()
          setDeleteDialog(null)
        },
      },
    )
  }

  return (
    <ListView>
      <ListViewHeader />
      <DataTable table={table} />

      <AlertDialog
        open={deleteDialog?.open}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog?.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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