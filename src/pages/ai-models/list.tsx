import { Link, useDelete, useNavigation, useSelect } from '@refinedev/core'
import { useTable } from '@refinedev/react-table'
import type { ColumnDef, VisibilityState } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { startCase } from 'lodash-es'
import { Pencil, Trash2 } from 'lucide-react'
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
import type { Tables } from '@/types/database.types'
import { fCurrency, fShortenNumber } from '@/utils/format'

type AiModel = Tables<'ai_models'> & {
	ai_providers: Pick<Tables<'ai_providers'>, 'id' | 'name'>
	prompt_models: Array<{ count: number }>
}

const STORAGE_KEY = 'ai-models-column-visibility'

type ExportAiModel = {
	capabilities: string
	context_window: null | number
	cost_input_per_million: null | number
	cost_output_per_million: null | number
	created_at: string
	id: string
	max_output_tokens: null | number
	name: string
	provider_id: string
	provider_name: string
}

const EXPORT_COLUMNS: Array<ColumnMapping<ExportAiModel>> = [
	{ header: 'ID', key: 'id' },
	{ header: 'Name', key: 'name' },
	{ header: 'Provider ID', key: 'provider_id' },
	{ header: 'Provider Name', key: 'provider_name' },
	{ header: 'Capabilities', key: 'capabilities' },
	{ header: 'Context Window', key: 'context_window' },
	{ header: 'Max Output', key: 'max_output_tokens' },
	{ header: 'Cost Input/1M', key: 'cost_input_per_million' },
	{ header: 'Cost Output/1M', key: 'cost_output_per_million' },
	{ header: 'Created At', key: 'created_at' }
]

export function AiModelsList() {
	const { edit } = useNavigation()
	const { mutateAsync: deleteModel } = useDelete()
	const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(STORAGE_KEY, {})

	// Fetch providers for filter dropdown
	const { options: providerOptions } = useSelect<Tables<'ai_providers'>>({
		optionLabel: 'name',
		optionValue: 'id',
		pagination: { pageSize: 1000 },
		resource: 'ai_providers'
	})

	const columns = useMemo<Array<ColumnDef<AiModel>>>(
		() => [
			{
				accessorKey: 'name',
				cell: ({ row }) => (
					<>
						<div className="font-medium">{row.original.name}</div>
						<div className="text-xs text-muted-foreground font-mono">{row.original.id}</div>
					</>
				),
				header: ({ column, table }) => (
					<div className="flex items-center gap-1">
						<span>Model</span>
						<DataTableSorter column={column} />
					</div>
				),
				id: 'name'
			},
			{
				accessorKey: 'provider_id',
				cell: ({ row }) => (
					<>
						<div className="font-medium">{row.original.ai_providers.name}</div>
						<div className="text-xs text-muted-foreground font-mono">
							{row.original.ai_providers.id}
						</div>
					</>
				),
				header: ({ column, table }) => (
					<div className="flex items-center gap-1">
						<span>Provider</span>
						<DataTableSorter column={column} />
						<DataTableFilterCombobox
							column={column}
							defaultOperator="eq"
							operators={['eq']}
							options={providerOptions}
							table={table}
						/>
						<DataTableFilterClearButton column={column} />
					</div>
				),
				id: 'provider_id'
			},
			{
				accessorKey: 'capabilities',
				cell: ({ getValue }) => {
					const caps = getValue() as Array<string>
					if (!caps?.length) {
						return <span className="text-muted-foreground">—</span>
					}
					return (
						<div className="flex flex-wrap gap-1">
							{caps.map((cap) => (
								<Badge className="text-xs" key={cap} variant="outline">
									{startCase(cap)}
								</Badge>
							))}
						</div>
					)
				},
				enableSorting: false,
				header: 'Capabilities',
				id: 'capabilities'
			},
			{
				accessorKey: 'context_window',
				cell: ({ getValue }) => {
					const value = getValue() as null | number
					if (!value) return <span className="text-muted-foreground">—</span>
					return <span className="text-sm tabular-nums">{fShortenNumber(value)}</span>
				},
				header: ({ column }) => (
					<div className="flex items-center gap-1">
						<span>Context Window</span>
						<DataTableSorter column={column} />
					</div>
				),
				id: 'context_window'
			},
			{
				accessorKey: 'max_output_tokens',
				cell: ({ getValue }) => {
					const value = getValue() as null | number
					if (!value) return <span className="text-muted-foreground">—</span>
					return <span className="text-sm tabular-nums">{fShortenNumber(value)}</span>
				},
				header: ({ column }) => (
					<div className="flex items-center gap-1">
						<span>Max Output</span>
						<DataTableSorter column={column} />
					</div>
				),
				id: 'max_output_tokens'
			},
			{
				cell: ({ row }) => {
					const input = row.original.cost_input_per_million
					const output = row.original.cost_output_per_million
					if (!input && !output) {
						return <span className="text-muted-foreground">—</span>
					}
					return (
						<div className="text-sm tabular-nums">
							<div className="flex items-center gap-1">
								<span className="text-muted-foreground text-xs">In:</span>
								<span>{input ? fCurrency(input) : '—'}</span>
							</div>
							<div className="flex items-center gap-1">
								<span className="text-muted-foreground text-xs">Out:</span>
								<span>{output ? fCurrency(output) : '—'}</span>
							</div>
						</div>
					)
				},
				enableSorting: false,
				header: 'Cost / 1M tokens',
				id: 'cost'
			},
			{
				cell: ({ row }) => {
					const count = row.original.prompt_models?.[0]?.count ?? 0
					if (count === 0) {
						return <span className="text-muted-foreground">0 prompts</span>
					}
					const filterParams = new URLSearchParams({
						'filters[0][field]': 'model_id',
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
							onClick={() => edit('ai_models', row.original.id)}
							size="icon"
							variant="ghost"
						>
							<Pencil className="size-4" />
							<span className="sr-only">Edit</span>
						</Button>
						<ActionButton
							action={async () => {
								await deleteModel({
									id: row.original.id,
									resource: 'ai_models'
								})
								return { error: false }
							}}
							areYouSureDescription={
								<>
									This will permanently delete the model "{row.original.name}". This action cannot
									be undone.
								</>
							}
							areYouSureTitle="Delete AI Model?"
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
		[edit, deleteModel, providerOptions]
	)

	const table = useTable<AiModel>({
		columns,
		enableMultiSort: false,
		onColumnVisibilityChange: setColumnVisibility,
		refineCoreProps: {
			meta: {
				select: '*, ai_providers(id, name), prompt_models(count)'
			},
			resource: 'ai_models',
			sorters: {
				initial: [{ field: 'created_at', order: 'desc' }]
			}
		},
		state: {
			columnVisibility
		}
	})

	const tableData = table.refineCore.tableQuery.data?.data ?? []
	const exportData = transformModelsForExport(tableData)

	const handleImportSuccess = () => {
		table.refineCore.tableQuery.refetch()
	}

	return (
		<ListView>
			<ListViewHeader
				action={
					<div className="flex items-center gap-2">
						<DataTableImport<ExportAiModel>
							columns={EXPORT_COLUMNS}
							excludeFields={['provider_name', 'created_at']}
							onSuccess={handleImportSuccess}
							relationships={[
								{
									field: 'provider_id',
									resource: 'ai_providers'
								}
							]}
							resource="ai_models"
							templateFilename="ai-models-template"
							transformBeforeInsert={(row) => ({
								...row,
								capabilities: row.capabilities
									? String(row.capabilities)
											.split(',')
											.map((s) => s.trim())
									: []
							})}
						/>
						<DataTableExport
							columns={EXPORT_COLUMNS}
							data={exportData}
							filename="ai-models"
							resource="ai_models"
							select="*, ai_providers(id, name)"
							transformData={(data) => transformModelsForExport(data as Array<AiModel>)}
						/>
					</div>
				}
				table={table}
			/>
			<DataTable
				onDelete={async (row) => {
					await deleteModel({
						id: row.id,
						resource: 'ai_models'
					})
				}}
				resource="ai_models"
				table={table}
			/>
		</ListView>
	)
}

function transformModelsForExport(models: Array<AiModel>): Array<ExportAiModel> {
	return models.map((m) => ({
		capabilities: m.capabilities?.join(', ') || '',
		context_window: m.context_window,
		cost_input_per_million: m.cost_input_per_million,
		cost_output_per_million: m.cost_output_per_million,
		created_at: m.created_at,
		id: m.id,
		max_output_tokens: m.max_output_tokens,
		name: m.name,
		provider_id: m.provider_id,
		provider_name: m.ai_providers?.name || ''
	}))
}
