import { Link, useDelete, useNavigation } from '@refinedev/core'
import { useTable } from '@refinedev/react-table'
import type { ColumnDef, VisibilityState } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getImageUrl } from '@/libs/storage'
import type { Tables } from '@/types/database.types'

type AiProvider = Tables<'ai_providers'> & {
	ai_models: Array<Pick<Tables<'ai_models'>, 'id' | 'name'>>
}

const STORAGE_KEY = 'ai-providers-column-visibility'

const EXPORT_COLUMNS: Array<ColumnMapping<AiProvider>> = [
	{ example: 'openai', header: 'ID', key: 'id' },
	{ example: 'OpenAI', header: 'Name', key: 'name' },
	{ example: 'https://openai.com', header: 'Website URL', key: 'website_url' },
	{ example: '', header: 'Logo URL', key: 'logo_url' },
	{ example: '', header: 'Created At', key: 'created_at' }
]

export function AiProvidersList() {
	const { edit } = useNavigation()
	const { mutateAsync: deleteProvider } = useDelete()
	const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(STORAGE_KEY, {})

	const columns = useMemo<Array<ColumnDef<AiProvider>>>(
		() => [
			{
				accessorKey: 'logo_url',
				cell: ({ row }) => {
					const logoUrl = getImageUrl(row.original.logo_url)
					return logoUrl ? (
						<img
							alt={row.original.name}
							className="size-8 rounded border object-contain p-1"
							src={logoUrl}
						/>
					) : (
						<div className="flex size-8 items-center justify-center rounded border bg-muted text-xs font-medium">
							{row.original.name.charAt(0)}
						</div>
					)
				},
				enableHiding: false,
				enableSorting: false,
				header: '',
				id: 'logo',
				size: 60
			},
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
						<span>Provider</span>
						<DataTableSorter column={column} />
					</div>
				),
				id: 'name'
			},
			{
				cell: ({ row }) => {
					const models = row.original.ai_models ?? []
					const count = models.length
					if (count === 0) {
						return <span className="text-muted-foreground">—</span>
					}
					const filterParams = new URLSearchParams({
						'filters[0][field]': 'provider_id',
						'filters[0][operator]': 'eq',
						'filters[0][value]': row.original.id
					})
					return (
						<Tooltip>
							<TooltipTrigger asChild>
								<Link
									className="text-sm text-primary hover:underline"
									to={`/ai-models?${filterParams.toString()}`}
								>
									{count} {count === 1 ? 'model' : 'models'}
								</Link>
							</TooltipTrigger>
							<TooltipContent className="max-w-64" side="right">
								<ul className="text-xs">
									{models.map((model) => (
										<li key={model.id}>{model.name}</li>
									))}
								</ul>
							</TooltipContent>
						</Tooltip>
					)
				},
				enableSorting: false,
				header: 'Models',
				id: 'models'
			},
			{
				accessorKey: 'website_url',
				cell: ({ getValue }) => {
					const url = getValue() as null | string
					return url ? (
						<a
							className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
							href={url}
							rel="noopener noreferrer"
							target="_blank"
						>
							<ExternalLink className="size-3" />
							<span>Visit site</span>
						</a>
					) : (
						<span className="text-muted-foreground">—</span>
					)
				},
				enableSorting: false,
				header: 'Website',
				id: 'website_url'
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
							onClick={() => edit('ai_providers', row.original.id)}
							size="icon"
							variant="ghost"
						>
							<Pencil className="size-4" />
							<span className="sr-only">Edit</span>
						</Button>
						<ActionButton
							action={async () => {
								await deleteProvider({
									id: row.original.id,
									resource: 'ai_providers'
								})
								return { error: false }
							}}
							areYouSureDescription={
								<>
									This will permanently delete the provider "{row.original.name}
									". This action cannot be undone.
								</>
							}
							areYouSureTitle="Delete AI Provider?"
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
		[edit, deleteProvider]
	)

	const table = useTable<AiProvider>({
		columns,
		enableMultiSort: false,
		onColumnVisibilityChange: setColumnVisibility,
		refineCoreProps: {
			meta: {
				select: '*, ai_models(id, name)'
			},
			resource: 'ai_providers',
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
		table.refineCore.tableQuery.refetch()
	}

	return (
		<ListView>
			<ListViewHeader
				action={
					<div className="flex items-center gap-2">
						<DataTableImport<AiProvider>
							columns={EXPORT_COLUMNS}
							excludeFields={['created_at', 'logo_url']}
							onSuccess={handleImportSuccess}
							resource="ai_providers"
							templateFilename="ai-providers-template"
						/>
						<DataTableExport
							columns={EXPORT_COLUMNS}
							data={tableData}
							filename="ai-providers"
							resource="ai_providers"
							select="*"
						/>
					</div>
				}
				table={table}
			/>
			<DataTable
				onDelete={async (row) => {
					await deleteProvider({
						id: row.id,
						resource: 'ai_providers'
					})
				}}
				resource="ai_providers"
				table={table}
			/>
		</ListView>
	)
}
