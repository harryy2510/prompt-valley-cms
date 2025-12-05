import { Link, useDelete, useNavigation } from '@refinedev/core'
import { useTable } from '@refinedev/react-table'
import type { ColumnDef, VisibilityState } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { CornerDownRight, Pencil, Trash2 } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/libs/cn'
import type { Tables } from '@/types/database.types'
import { fShortenNumber } from '@/utils/format'

type Category = Tables<'categories'> & {
	children: Array<Pick<Tables<'categories'>, 'id' | 'name'>>
	parent: null | Pick<Tables<'categories'>, 'id' | 'name'>
	prompts: Array<{ count: number }>
}

const STORAGE_KEY = 'categories-column-visibility'

type ExportCategory = {
	created_at: string
	id: string
	name: string
	parent_id: null | string
}

const EXPORT_COLUMNS: Array<ColumnMapping<ExportCategory>> = [
	{ header: 'ID', key: 'id' },
	{ header: 'Name', key: 'name' },
	{ header: 'Parent ID', key: 'parent_id' },
	{ header: 'Created At', key: 'created_at' }
]

export function CategoriesList() {
	const { edit } = useNavigation()
	const { mutateAsync: deleteCategory } = useDelete()
	const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(STORAGE_KEY, {})

	const columns = useMemo<Array<ColumnDef<Category>>>(
		() => [
			{
				accessorKey: 'name',
				cell: ({ row }) => {
					const hasParent = !!row.original.parent
					const children = row.original.children ?? []
					const childCount = children.length

					return (
						<div className={cn('flex items-center gap-2', hasParent && 'pl-6')}>
							{hasParent && <CornerDownRight className="size-4 text-muted-foreground" />}
							<div>
								<div className="flex items-center gap-2">
									<span className="font-medium">{row.original.name}</span>
									{!hasParent && childCount > 0 && (
										<Tooltip>
											<TooltipTrigger asChild>
												<Badge className="font-normal text-xs cursor-default" variant="secondary">
													{childCount}
												</Badge>
											</TooltipTrigger>
											<TooltipContent className="max-w-64" side="right">
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
								<div className="text-xs text-muted-foreground font-mono">{row.original.id}</div>
							</div>
						</div>
					)
				},
				header: ({ column }) => (
					<div className="flex items-center gap-1">
						<span>Category</span>
						<DataTableSorter column={column} />
					</div>
				),
				id: 'name'
			},
			{
				accessorKey: 'parent_id',
				cell: ({ row }) => {
					const parent = row.original.parent
					if (!parent) {
						return <span className="text-muted-foreground">—</span>
					}
					return (
						<div>
							<div className="text-sm">{parent.name}</div>
							<div className="text-xs text-muted-foreground font-mono">{parent.id}</div>
						</div>
					)
				},
				enableSorting: false,
				header: 'Parent',
				id: 'parent'
			},
			{
				cell: ({ row }) => {
					const count = row.original.prompts?.[0]?.count ?? 0
					if (count === 0) {
						return <span className="text-muted-foreground">0 prompts</span>
					}
					const filterParams = new URLSearchParams({
						'filters[0][field]': 'category_id',
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
				cell: ({ row }) => {
					const children = row.original.children ?? []
					const hasChildren = children.length > 0

					return (
						<div className="flex items-center justify-end gap-1">
							<Button
								className="size-8"
								onClick={() => edit('categories', row.original.id)}
								size="icon"
								variant="ghost"
							>
								<Pencil className="size-4" />
								<span className="sr-only">Edit</span>
							</Button>
							<ActionButton
								action={async () => {
									await deleteCategory({
										id: row.original.id,
										resource: 'categories'
									})
									return { error: false }
								}}
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
										<p className="text-sm text-muted-foreground">This action cannot be undone.</p>
									</div>
								}
								areYouSureTitle="Delete Category?"
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
					)
				},
				enableHiding: false,
				enableSorting: false,
				header: '',
				id: 'actions',
				size: 80
			}
		],
		[edit, deleteCategory]
	)

	const table = useTable<Category>({
		columns,
		enableMultiSort: false,
		onColumnVisibilityChange: setColumnVisibility,
		refineCoreProps: {
			meta: {
				select: '*, parent:parent_id(id, name), children:categories(id, name), prompts(count)'
			},
			resource: 'categories',
			sorters: {
				initial: [{ field: 'created_at', order: 'desc' }]
			}
		},
		state: {
			columnVisibility
		}
	})

	const tableData = table.refineCore.tableQuery.data?.data ?? []
	const exportData = transformCategoriesForExport(tableData)

	const handleImportSuccess = () => {
		table.refineCore.tableQuery.refetch()
	}

	return (
		<ListView>
			<ListViewHeader
				action={
					<div className="flex items-center gap-2">
						<DataTableImport<ExportCategory>
							columns={EXPORT_COLUMNS}
							excludeFields={['created_at']}
							onSuccess={handleImportSuccess}
							relationships={[
								{
									field: 'parent_id',
									resource: 'categories'
								}
							]}
							resource="categories"
							templateFilename="categories-template"
						/>
						<DataTableExport
							columns={EXPORT_COLUMNS}
							data={exportData}
							filename="categories"
							resource="categories"
							select="*, parent:parent_id(id, name), children:categories(id, name)"
							transformData={(data) => transformCategoriesForExport(data as Array<Category>)}
						/>
					</div>
				}
				table={table}
			/>
			<DataTable
				onDelete={async (row) => {
					await deleteCategory({
						id: row.id,
						resource: 'categories'
					})
				}}
				resource="categories"
				table={table}
			/>
		</ListView>
	)
}

function transformCategoriesForExport(categories: Array<Category>): Array<ExportCategory> {
	return categories.map((c) => ({
		created_at: c.created_at,
		id: c.id,
		name: c.name,
		parent_id: c.parent_id
	}))
}
