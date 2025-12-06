import { useDelete, useNavigation, useSelect, useUpdate } from '@refinedev/core'
import { useTable } from '@refinedev/react-table'
import type { ColumnDef, VisibilityState } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useLocalStorage } from 'usehooks-ts'

import { DataTable } from '@/components/refine-ui/data-table/data-table'
import {
	DataTableExport,
	DataTableImport
} from '@/components/refine-ui/data-table/data-table-export-import'
import type { ColumnMapping } from '@/components/refine-ui/data-table/data-table-export-import'
import {
	DataTableFilterClearButton,
	DataTableFilterCombobox
} from '@/components/refine-ui/data-table/data-table-filter'
import { DataTableSorter } from '@/components/refine-ui/data-table/data-table-sorter'
import { ListView, ListViewHeader } from '@/components/refine-ui/views/list-view'
import { ActionButton } from '@/components/ui/action-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Tables } from '@/types/database.types'
import { fShortenNumber } from '@/utils/format'

type Prompt = Tables<'prompts'> & {
	categories: null | Pick<Tables<'categories'>, 'id' | 'name'>
	prompt_models: Array<{ ai_models: Pick<Tables<'ai_models'>, 'id' | 'name'> }>
	prompt_tags: Array<{ tags: Pick<Tables<'tags'>, 'id' | 'name'> }>
}

const STORAGE_KEY = 'prompts-column-visibility'

type ExportPrompt = Pick<
	Tables<'prompts'>,
	| 'category_id'
	| 'content'
	| 'created_at'
	| 'description'
	| 'id'
	| 'is_featured'
	| 'is_published'
	| 'tier'
	| 'title'
> & {
	model_ids: string
	tag_ids: string
}

const EXPORT_COLUMNS: Array<ColumnMapping<ExportPrompt>> = [
	{ header: 'ID', key: 'id' },
	{ header: 'Title', key: 'title' },
	{ header: 'Description', key: 'description' },
	{ header: 'Content', key: 'content' },
	{ header: 'Category ID', key: 'category_id' },
	{ header: 'Tier', key: 'tier' },
	{ header: 'Published', key: 'is_published' },
	{ header: 'Featured', key: 'is_featured' },
	{ header: 'Tag IDs', key: 'tag_ids' },
	{ header: 'Model IDs', key: 'model_ids' },
	{ header: 'Created At', key: 'created_at' }
]

function transformPromptsForExport(prompts: Array<Prompt>): Array<ExportPrompt> {
	return prompts.map((p) => ({
		category_id: p.category_id,
		content: p.content,
		created_at: p.created_at,
		description: p.description,
		id: p.id,
		is_featured: p.is_featured,
		is_published: p.is_published,
		model_ids: p.prompt_models?.map((pm) => pm.ai_models.id).join(', ') || '',
		tag_ids: p.prompt_tags?.map((pt) => pt.tags.id).join(', ') || '',
		tier: p.tier,
		title: p.title
	}))
}

const TIER_OPTIONS = [
	{ label: 'Free', value: 'free' },
	{ label: 'Pro', value: 'pro' }
]

const STATUS_OPTIONS = [
	{ label: 'Published', value: 'true' },
	{ label: 'Draft', value: 'false' }
]

export function PromptsList() {
	const { edit, show } = useNavigation()
	const { mutateAsync: deletePrompt } = useDelete()
	const { mutateAsync: updatePrompt } = useUpdate()
	const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(STORAGE_KEY, {})

	const { options: categoryOptions } = useSelect<Tables<'categories'>>({
		optionLabel: 'name',
		optionValue: 'id',
		pagination: { pageSize: 1000 },
		resource: 'categories'
	})

	const { options: tagOptions } = useSelect<Tables<'tags'>>({
		optionLabel: 'name',
		optionValue: 'id',
		pagination: { pageSize: 1000 },
		resource: 'tags'
	})

	const { options: modelOptions } = useSelect<Tables<'ai_models'>>({
		optionLabel: 'name',
		optionValue: 'id',
		pagination: { pageSize: 1000 },
		resource: 'ai_models'
	})

	const columns = useMemo<Array<ColumnDef<Prompt>>>(
		() => [
			{
				accessorKey: 'title',
				cell: ({ row }) => (
					<>
						<div className="font-medium">{row.original.title}</div>
						<div className="text-xs text-muted-foreground font-mono">{row.original.id}</div>
					</>
				),
				header: ({ column }) => (
					<div className="flex items-center gap-1">
						<span>Title</span>
						<DataTableSorter column={column} />
					</div>
				),
				id: 'title'
			},
			{
				accessorKey: 'category_id',
				cell: ({ row }) => {
					const category = row.original.categories
					if (!category) {
						return <span className="text-muted-foreground">—</span>
					}
					return <span className="text-sm">{category.name}</span>
				},
				header: ({ column, table }) => (
					<div className="flex items-center gap-1">
						<span>Category</span>
						<DataTableSorter column={column} />
						<DataTableFilterCombobox
							column={column}
							defaultOperator="eq"
							operators={['eq']}
							options={categoryOptions}
							table={table}
						/>
						<DataTableFilterClearButton column={column} />
					</div>
				),
				id: 'category_id'
			},
			{
				accessorKey: 'tag_id',
				cell: ({ row }) => {
					const tags = row.original.prompt_tags?.map((pt) => pt.tags) ?? []
					if (tags.length === 0) {
						return <span className="text-muted-foreground">—</span>
					}
					const displayTags = tags.slice(0, 2)
					const remaining = tags.length - 2
					return (
						<div className="flex flex-wrap gap-1">
							{displayTags.map((tag) => (
								<Badge className="text-xs" key={tag.id} variant="secondary">
									{tag.name}
								</Badge>
							))}
							{remaining > 0 && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Badge className="text-xs cursor-default" variant="outline">
											+{remaining}
										</Badge>
									</TooltipTrigger>
									<TooltipContent>
										<ul className="text-xs">
											{tags.slice(2).map((tag) => (
												<li key={tag.id}>{tag.name}</li>
											))}
										</ul>
									</TooltipContent>
								</Tooltip>
							)}
						</div>
					)
				},
				enableSorting: false,
				header: ({ column, table }) => (
					<div className="flex items-center gap-1">
						<span>Tags</span>
						<DataTableFilterCombobox
							column={column}
							defaultOperator="eq"
							operators={['eq']}
							options={tagOptions}
							table={table}
						/>
						<DataTableFilterClearButton column={column} />
					</div>
				),
				id: 'tag_id'
			},
			{
				accessorKey: 'model_id',
				cell: ({ row }) => {
					const models = row.original.prompt_models?.map((pm) => pm.ai_models) ?? []
					if (models.length === 0) {
						return <span className="text-muted-foreground">—</span>
					}
					const displayModels = models.slice(0, 2)
					const remaining = models.length - 2
					return (
						<div className="flex flex-wrap gap-1">
							{displayModels.map((model) => (
								<Badge className="text-xs" key={model.id} variant="outline">
									{model.name}
								</Badge>
							))}
							{remaining > 0 && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Badge className="text-xs cursor-default" variant="outline">
											+{remaining}
										</Badge>
									</TooltipTrigger>
									<TooltipContent>
										<ul className="text-xs">
											{models.slice(2).map((model) => (
												<li key={model.id}>{model.name}</li>
											))}
										</ul>
									</TooltipContent>
								</Tooltip>
							)}
						</div>
					)
				},
				enableSorting: false,
				header: ({ column, table }) => (
					<div className="flex items-center gap-1">
						<span>Models</span>
						<DataTableFilterCombobox
							column={column}
							defaultOperator="eq"
							operators={['eq']}
							options={modelOptions}
							table={table}
						/>
						<DataTableFilterClearButton column={column} />
					</div>
				),
				id: 'model_id'
			},
			{
				accessorKey: 'tier',
				cell: ({ getValue }) => {
					const tier = getValue() as 'free' | 'pro'
					return (
						<Badge className="capitalize" variant={tier === 'pro' ? 'default' : 'secondary'}>
							{tier}
						</Badge>
					)
				},
				header: ({ column, table }) => (
					<div className="flex items-center gap-1">
						<span>Tier</span>
						<DataTableSorter column={column} />
						<DataTableFilterCombobox
							column={column}
							defaultOperator="eq"
							operators={['eq']}
							options={TIER_OPTIONS}
							table={table}
						/>
						<DataTableFilterClearButton column={column} />
					</div>
				),
				id: 'tier'
			},
			{
				accessorKey: 'is_published',
				cell: ({ row }) => {
					const isPublished = row.original.is_published
					return (
						<Switch
							checked={isPublished}
							onCheckedChange={async (checked) => {
								await updatePrompt({
									id: row.original.id,
									mutationMode: 'optimistic',
									resource: 'prompts',
									values: { is_published: checked }
								})
							}}
						/>
					)
				},
				header: ({ column, table }) => (
					<div className="flex items-center gap-1">
						<span>Published</span>
						<DataTableSorter column={column} />
						<DataTableFilterCombobox
							column={column}
							defaultOperator="eq"
							operators={['eq']}
							options={STATUS_OPTIONS}
							table={table}
						/>
						<DataTableFilterClearButton column={column} />
					</div>
				),
				id: 'is_published'
			},
			{
				accessorKey: 'is_featured',
				cell: ({ row }) => {
					const isFeatured = row.original.is_featured
					return (
						<Switch
							checked={isFeatured}
							onCheckedChange={async (checked) => {
								await updatePrompt({
									id: row.original.id,
									mutationMode: 'optimistic',
									resource: 'prompts',
									values: { is_featured: checked }
								})
							}}
						/>
					)
				},
				header: ({ column }) => (
					<div className="flex items-center gap-1">
						<span>Featured</span>
						<DataTableSorter column={column} />
					</div>
				),
				id: 'is_featured'
			},
			{
				accessorKey: 'views_count',
				cell: ({ getValue }) => {
					const count = getValue() as number
					return <span className="text-sm tabular-nums">{fShortenNumber(count || 0)}</span>
				},
				header: ({ column }) => (
					<div className="flex items-center gap-1">
						<span>Views</span>
						<DataTableSorter column={column} />
					</div>
				),
				id: 'views_count'
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
							onClick={() => show('prompts', row.original.id)}
							size="icon"
							variant="ghost"
						>
							<Eye className="size-4" />
							<span className="sr-only">View</span>
						</Button>
						<Button
							className="size-8"
							onClick={() => edit('prompts', row.original.id)}
							size="icon"
							variant="ghost"
						>
							<Pencil className="size-4" />
							<span className="sr-only">Edit</span>
						</Button>
						<ActionButton
							action={async () => {
								await deletePrompt({
									id: row.original.id,
									resource: 'prompts'
								})
								return { error: false }
							}}
							areYouSureDescription={
								<>
									This will permanently delete the prompt "{row.original.title}
									". This action cannot be undone.
								</>
							}
							areYouSureTitle="Delete Prompt?"
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
				size: 120
			}
		],
		[categoryOptions, tagOptions, modelOptions, updatePrompt, show, edit, deletePrompt]
	)

	const table = useTable<Prompt>({
		columns,
		enableMultiSort: false,
		onColumnVisibilityChange: setColumnVisibility,
		refineCoreProps: {
			meta: {
				select:
					'*, categories(id, name), prompt_tags(tags(id, name)), prompt_models(ai_models(id, name))'
			},
			resource: 'prompts',
			sorters: {
				initial: [{ field: 'created_at', order: 'desc' }]
			}
		},
		state: {
			columnVisibility
		}
	})

	const tableData = table.refineCore.tableQuery.data?.data ?? []
	const exportData = transformPromptsForExport(tableData)

	const handleImportSuccess = () => {
		void table.refineCore.tableQuery.refetch()
	}

	return (
		<ListView>
			<ListViewHeader
				action={
					<div className="flex items-center gap-2">
						<DataTableImport<ExportPrompt>
							columns={EXPORT_COLUMNS}
							excludeFields={['created_at']}
							onSuccess={handleImportSuccess}
							relationships={[
								{
									field: 'tag_ids',
									isMany: true,
									junctionFk: 'prompt_id',
									junctionRelatedFk: 'tag_id',
									junctionTable: 'prompt_tags',
									resource: 'tags'
								},
								{
									field: 'model_ids',
									isMany: true,
									junctionFk: 'prompt_id',
									junctionRelatedFk: 'model_id',
									junctionTable: 'prompt_models',
									resource: 'ai_models'
								},
								{
									field: 'category_id',
									resource: 'categories'
								}
							]}
							resource="prompts"
							templateFilename="prompts-template"
						/>
						<DataTableExport
							columns={EXPORT_COLUMNS}
							data={exportData}
							filename="prompts"
							resource="prompts"
							select="*, categories(id, name), prompt_tags(tags(id, name)), prompt_models(ai_models(id, name))"
							transformData={(data) => transformPromptsForExport(data as Array<Prompt>)}
						/>
					</div>
				}
				table={table}
			/>
			<DataTable
				onDelete={async (row) => {
					await deletePrompt({
						id: row.id,
						resource: 'prompts'
					})
				}}
				resource="prompts"
				table={table}
			/>
		</ListView>
	)
}
