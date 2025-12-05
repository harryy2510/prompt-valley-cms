import { useMemo } from 'react'
import { useTable } from '@refinedev/react-table'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { Pencil, Trash2 } from 'lucide-react'
import { useDelete, useNavigation, Link } from '@refinedev/core'
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
import { Tables } from '@/types/database.types'
import { fShortenNumber } from '@/utils/format'
import {
  DataTableExport,
  DataTableImport,
  ColumnMapping,
} from '@/components/refine-ui/data-table/data-table-export-import'

type Tag = Tables<'tags'> & {
  prompt_tags: { count: number }[]
}

const STORAGE_KEY = 'tags-column-visibility'

const EXPORT_COLUMNS: ColumnMapping<Tag>[] = [
  { key: 'id', header: 'ID', example: 'tag-slug' },
  { key: 'name', header: 'Name', example: 'My Tag' },
  { key: 'created_at', header: 'Created At', example: '' },
]

export function TagsList() {
  const { edit } = useNavigation()
  const { mutateAsync: deleteTag } = useDelete()
  const [columnVisibility, setColumnVisibility] =
    useLocalStorage<VisibilityState>(STORAGE_KEY, {})

  const columns = useMemo<ColumnDef<Tag>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>Tag</span>
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
        id: 'prompts',
        header: 'Prompts',
        enableSorting: false,
        cell: ({ row }) => {
          const count = row.original.prompt_tags?.[0]?.count ?? 0
          if (count === 0) {
            return <span className="text-muted-foreground">0 prompts</span>
          }
          const filterParams = new URLSearchParams({
            'filters[0][field]': 'tag_id',
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
              onClick={() => edit('tags', row.original.id)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <ActionButton
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              requireAreYouSure
              areYouSureTitle="Delete Tag?"
              areYouSureDescription={
                <>
                  This will permanently delete the tag "{row.original.name}".
                  This action cannot be undone.
                </>
              }
              confirmLabel="Delete"
              action={async () => {
                await deleteTag({
                  resource: 'tags',
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
    [edit, deleteTag],
  )

  const table = useTable<Tag>({
    enableMultiSort: false,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    refineCoreProps: {
      resource: 'tags',
      meta: {
        select: '*, prompt_tags(count)',
      },
      sorters: {
        initial: [{ field: 'created_at', order: 'desc' }],
      },
    },
  })

  const tableData = table.refineCore.tableQuery.data?.data ?? []

  const handleImportSuccess = () => {
    table.refineCore.tableQuery.refetch()
  }

  return (
    <ListView>
      <ListViewHeader
        table={table}
        action={
          <div className="flex items-center gap-2">
            <DataTableImport<Tag>
              resource="tags"
              columns={EXPORT_COLUMNS}
              templateFilename="tags-template"
              onSuccess={handleImportSuccess}
              excludeFields={['created_at']}
            />
            <DataTableExport
              data={tableData}
              filename="tags"
              columns={EXPORT_COLUMNS}
              resource="tags"
              select="*"
            />
          </div>
        }
      />
      <DataTable
        table={table}
        resource="tags"
        onDelete={async (row) => {
          await deleteTag({
            resource: 'tags',
            id: row.id,
          })
        }}
      />
    </ListView>
  )
}
