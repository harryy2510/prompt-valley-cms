import { Link, useDelete, useNavigation } from '@refinedev/core'
import { useTable } from '@refinedev/react-table'
import type { ColumnDef, VisibilityState } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { Pencil, Trash2 } from 'lucide-react'
import pLimit from 'p-limit'
import { useMemo } from 'react'
import { useLocalStorage } from 'usehooks-ts'

import { DataTable } from '@/components/refine-ui/data-table/data-table'
import {
	DataTableExport,
	DataTableImport
} from '@/components/refine-ui/data-table/data-table-export-import'
import type { ColumnMapping } from '@/components/refine-ui/data-table/data-table-export-import'
import { DataTableSorter } from '@/components/refine-ui/data-table/data-table-sorter'
import { ListView, ListViewHeader } from '@/components/refine-ui/views/list-view'
import { ActionButton } from '@/components/ui/action-button'
import { Button } from '@/components/ui/button'
import type { Tables } from '@/types/database.types'
import { fShortenNumber } from '@/utils/format'

type Tag = Tables<'tags'> & {
	prompt_tags: Array<{ count: number }>
}

const STORAGE_KEY = 'tags-column-visibility'

const EXPORT_COLUMNS: Array<ColumnMapping<Tag>> = [
	{ header: 'ID', key: 'id' },
	{ header: 'Name', key: 'name' },
	{ header: 'Created At', key: 'created_at' }
]

export function TagsList() {
	const { edit } = useNavigation()
	const { mutateAsync: deleteTag } = useDelete()
	const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(STORAGE_KEY, {})

	const columns = useMemo<Array<ColumnDef<Tag>>>(
		() => [
			{
				accessorKey: 'name',
				cell: ({ row }) => (
					<>
						<div className="font-medium">{row.original.name}</div>
						<div className="text-xs text-muted-foreground font-mono">{row.original.id}</div>
					</>
				),
				header: ({ column }) => (
					<div className="flex items-center gap-1">
						<span>Tag</span>
						<DataTableSorter column={column} />
					</div>
				),
				id: 'name'
			},
			{
				cell: ({ row }) => {
					const count = row.original.prompt_tags?.[0]?.count ?? 0
					if (count === 0) {
						return <span className="text-muted-foreground">0 prompts</span>
					}
					const filterParams = new URLSearchParams({
						'filters[0][field]': 'tag_id',
						'filters[0][operator]': 'eq',
						'filters[0][value]': row.original.id
					})
					return (
						<Link
							className="text-sm font-medium text-primary hover:underline"
							to={`/prompts?${filterParams.toString()}`}
						>
							{fShortenNumber(count)} {count === 1 ? 'prompt' : 'prompts'}
						</Link>
					)
				},
				enableSorting: false,
				header: 'Prompts',
				id: 'prompts'
			},
			{
				accessorKey: 'created_at',
				cell: ({ getValue }) => {
					const value = getValue() as string
					return (
						<span className="text-sm text-muted-foreground">
							{dayjs(value).format('DD MMM, YYYY')}
						</span>
					)
				},
				header: ({ column }) => (
					<div className="flex items-center gap-1">
						<span>Created</span>
						<DataTableSorter column={column} />
					</div>
				),
				id: 'created_at'
			},
			{
				accessorKey: 'updated_at',
				cell: ({ getValue }) => {
					const value = getValue() as string
					return (
						<span className="text-sm text-muted-foreground">
							{dayjs(value).format('DD MMM, YYYY')}
						</span>
					)
				},
				header: ({ column }) => (
					<div className="flex items-center gap-1">
						<span>Updated</span>
						<DataTableSorter column={column} />
					</div>
				),
				id: 'updated_at'
			},
			{
				cell: ({ row }) => (
					<div className="flex items-center justify-end gap-1">
						<Button
							className="size-8"
							onClick={() => edit('tags', row.original.id)}
							size="icon"
							variant="ghost"
						>
							<Pencil className="size-4" />
							<span className="sr-only">Edit</span>
						</Button>
						<ActionButton
							action={async () => {
								await deleteTag({
									id: row.original.id,
									resource: 'tags'
								})
								return { error: false }
							}}
							areYouSureDescription={
								<>
									This will permanently delete the tag "{row.original.name}". This action cannot be
									undone.
								</>
							}
							areYouSureTitle="Delete Tag?"
							className="size-8 text-destructive"
							confirmLabel="Delete"
							requireAreYouSure
							size="icon"
							variant="ghost"
						>
							<Trash2 className="size-4" />
							<span className="sr-only">Delete</span>
						</ActionButton>
					</div>
				),
				enableHiding: false,
				enableSorting: false,
				header: '',
				id: 'actions',
				size: 80
			}
		],
		[edit, deleteTag]
	)

	const table = useTable<Tag>({
		columns,
		enableMultiSort: false,
		onColumnVisibilityChange: setColumnVisibility,
		refineCoreProps: {
			meta: {
				select: '*, prompt_tags(count)'
			},
			resource: 'tags',
			sorters: {
				initial: [{ field: 'created_at', order: 'desc' }]
			}
		},
		state: {
			columnVisibility
		}
	})

	const tableData = table.refineCore.tableQuery.data?.data ?? []

	const handleImportSuccess = () => {
		void table.refineCore.tableQuery.refetch()
	}

	return (
		<ListView>
			<ListViewHeader
				action={
					<div className="flex items-center gap-2">
						<DataTableImport<Tag>
							columns={EXPORT_COLUMNS}
							excludeFields={['created_at', 'updated_at']}
							onSuccess={handleImportSuccess}
							resource="tags"
							templateFilename="tags-template"
						/>
						<DataTableExport
							columns={EXPORT_COLUMNS}
							data={tableData}
							filename="tags"
							resource="tags"
							select="*"
						/>
					</div>
				}
				table={table}
			/>
			<DataTable
				enableSelection
				onDelete={async (row) => {
					await deleteTag({
						id: row.id,
						resource: 'tags'
					})
				}}
				onDeleteMany={async (rows) => {
					const limit = pLimit(10)
					await Promise.all(
						rows.map((row) =>
							limit(() =>
								deleteTag({
									id: row.id,
									resource: 'tags'
								})
							)
						)
					)
				}}
				resource="tags"
				table={table}
			/>
		</ListView>
	)
}
