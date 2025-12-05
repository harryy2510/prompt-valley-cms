import { useMemo } from 'react'
import { useTable } from '@refinedev/react-table'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { CornerDownRight, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tables } from '@/types/database.types'
import { cn } from '@/libs/cn'
import { fShortenNumber } from '@/utils/format'
import {
  DataTableExport,
  ColumnMapping,
} from '@/components/refine-ui/data-table/data-table-export-import'

type Category = Tables<'categories'> & {
  parent: Pick<Tables<'categories'>, 'id' | 'name'> | null
  children: Pick<Tables<'categories'>, 'id' | 'name'>[]
  prompts: { count: number }[]
}

const STORAGE_KEY = 'categories-column-visibility'

const EXPORT_COLUMNS: ColumnMapping<Category>[] = [
  { key: 'id', header: 'ID', example: 'category-slug' },
  { key: 'name', header: 'Name', example: 'My Category' },
  { key: 'parent_id', header: 'Parent ID', example: 'parent-category-slug' },
  { key: 'created_at', header: 'Created At', example: '' },
]

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
          const children = row.original.children ?? []
          const childCount = children.length

          return (
            <div className={cn('flex items-center gap-2', hasParent && 'pl-6')}>
              {hasParent && (
                <CornerDownRight className="size-4 text-muted-foreground" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{row.original.name}</span>
                  {!hasParent && childCount > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="font-normal text-xs cursor-default"
                        >
                          {childCount}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-64">
                        <p className="font-medium mb-1">Sub-categories:</p>
                        <ul className="text-xs">
                          {children.map((child) => (
                            <li key={child.id}>{child.name}</li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
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
        id: 'prompts',
        header: 'Prompts',
        enableSorting: false,
        cell: ({ row }) => {
          const count = row.original.prompts?.[0]?.count ?? 0
          if (count === 0) {
            return <span className="text-muted-foreground">0 prompts</span>
          }
          const filterParams = new URLSearchParams({
            'filters[0][field]': 'category_id',
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
        cell: ({ row }) => {
          const children = row.original.children ?? []
          const hasChildren = children.length > 0

          return (
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
                  <div className="space-y-2">
                    <p>
                      This will permanently delete the category "
                      <strong>{row.original.name}</strong>".
                    </p>
                    {hasChildren && (
                      <div className="rounded-md bg-destructive/10 p-3 text-destructive">
                        <p className="font-medium">
                          This will also delete {children.length} sub-
                          {children.length === 1 ? 'category' : 'categories'}:
                        </p>
                        <ul className="mt-1 list-disc list-inside text-sm">
                          {children.map((child) => (
                            <li key={child.id}>{child.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      This action cannot be undone.
                    </p>
                  </div>
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
          )
        },
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
        select: '*, parent:parent_id(id, name), children:categories(id, name), prompts(count)',
      },
      sorters: {
        initial: [{ field: 'created_at', order: 'desc' }],
      },
    },
  })

  const tableData = table.refineCore.tableQuery.data?.data ?? []

  return (
    <ListView>
      <ListViewHeader
        table={table}
        action={
          <DataTableExport
            data={tableData}
            filename="categories"
            columns={EXPORT_COLUMNS}
          />
        }
      />
      <DataTable table={table} />
    </ListView>
  )
}
