import { useMemo } from 'react'
import { useTable } from '@refinedev/react-table'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { useDelete, useNavigation } from '@refinedev/core'
import { useLocalStorage } from 'usehooks-ts'
import dayjs from 'dayjs'

import {
  ListView,
  ListViewHeader,
} from '@/components/refine-ui/views/list-view'
import { DataTable } from '@/components/refine-ui/data-table/data-table'
import { DataTableSorter } from '@/components/refine-ui/data-table/data-table-sorter'
import { Button } from '@/components/ui/button'
import { ActionButton } from '@/components/ui/action-button'
import { Badge } from '@/components/ui/badge'
import { Tables } from '@/types/database.types'

type Category = Tables<'categories'> & {
  parent: Pick<Tables<'categories'>, 'id' | 'name'> | null
  children: { count: number }[]
}

const STORAGE_KEY = 'categories-column-visibility'

export function CategoriesList() {
  const { edit } = useNavigation()
  const { mutateAsync: deleteCategory } = useDelete()
  const [columnVisibility, setColumnVisibility] =
    useLocalStorage<VisibilityState>(STORAGE_KEY, {})

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>Category</span>
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ row }) => {
          const hasParent = !!row.original.parent
          const childCount = row.original.children?.[0]?.count ?? 0

          return (
            <div className="flex items-center gap-2">
              {hasParent && (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
              <div>
                <div className="font-medium">{row.original.name}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {row.original.id}
                </div>
              </div>
            </div>
          )
        },
      },
      {
        id: 'parent',
        accessorKey: 'parent_id',
        header: 'Parent',
        enableSorting: false,
        cell: ({ row }) => {
          const parent = row.original.parent
          if (!parent) {
            return <span className="text-muted-foreground">—</span>
          }
          return (
            <div>
              <div className="text-sm">{parent.name}</div>
              <div className="text-xs text-muted-foreground font-mono">
                {parent.id}
              </div>
            </div>
          )
        },
      },
      {
        id: 'children',
        header: 'Sub-Categories',
        enableSorting: false,
        cell: ({ row }) => {
          const childCount = row.original.children?.[0]?.count ?? 0
          const hasParent = !!row.original.parent

          // Subcategories can't have children (only one level deep)
          if (hasParent) {
            return <span className="text-muted-foreground">—</span>
          }

          if (childCount === 0) {
            return <span className="text-muted-foreground">—</span>
          }

          return (
            <Badge variant="secondary" className="font-normal">
              {childCount}{' '}
              {childCount === 1 ? 'sub-category' : 'sub-categories'}
            </Badge>
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
              onClick={() => edit('categories', row.original.id)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <ActionButton
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              requireAreYouSure
              areYouSureTitle="Delete Category?"
              areYouSureDescription={
                <>
                  This will permanently delete the category "{row.original.name}
                  ". This action cannot be undone.
                </>
              }
              confirmLabel="Delete"
              action={async () => {
                await deleteCategory({
                  resource: 'categories',
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
    [edit, deleteCategory],
  )

  const table = useTable<Category>({
    enableMultiSort: false,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    refineCoreProps: {
      resource: 'categories',
      meta: {
        select: '*, parent:parent_id(id, name), children:categories(count)',
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
