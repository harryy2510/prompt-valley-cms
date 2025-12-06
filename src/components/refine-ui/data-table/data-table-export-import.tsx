import { useCreate, useNotification } from '@refinedev/core'
import {
	AlertCircle,
	Check,
	CheckCircle2,
	Download,
	FileDown,
	FileSpreadsheet,
	Info,
	Loader2,
	Upload,
	XCircle
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import {
	deleteJunctionServer,
	exportDataServer,
	insertJunctionServer,
	upsertServer,
	validateIdsServer
} from '@/actions/crud'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { downloadTemplate, exportToFile, parseFile } from '@/libs/excel'
import type { ExportFormat } from '@/libs/excel'

export type ColumnMapping<T> = {
	example?: string
	header: string
	key: keyof T
}

export type DataTableExportProps<T extends Record<string, unknown>> = {
	columns?: Array<ColumnMapping<T>>
	data: Array<T>
	filename: string
	/** Resource name for fetching all data */
	resource?: string
	/** Select query for Supabase (e.g., '*, categories(id, name)') */
	select?: string
	/** Transform function to convert raw data to export format */
	transformData?: (data: Array<unknown>) => Array<T>
}

export type DataTableImportProps<T extends Record<string, unknown>> = {
	columns: Array<ColumnMapping<T>>
	/** Fields to exclude from main record creation (handled separately) */
	excludeFields?: Array<string>
	onSuccess?: () => void
	/** Configuration for relationship fields */
	relationships?: Array<RelationshipConfig>
	resource: string
	templateFilename: string
	/** Transform data before inserting into database (after field mapping) */
	transformBeforeInsert?: (row: Record<string, unknown>) => Record<string, unknown>
	transformRow?: (row: Record<string, unknown>) => Partial<T>
}

type ImportResult = {
	errors: Array<string>
	failed: number
	rowResults: Array<RowResult>
	success: number
}

type RelationshipConfig = {
	/** The field name in import data (e.g., 'tag_ids') */
	field: string
	/** Whether this is a many-to-many relationship */
	isMany?: boolean
	/** Foreign key in junction table pointing to main resource (e.g., 'prompt_id') */
	junctionFk?: string
	/** Foreign key in junction table pointing to related resource (e.g., 'tag_id') */
	junctionRelatedFk?: string
	/** Junction table for many-to-many (e.g., 'prompt_tags') */
	junctionTable?: string
	/** The resource to validate against (e.g., 'tags') */
	resource: string
}

type RowResult = {
	data: Record<string, unknown>
	error?: string
	rowIndex: number
	status: 'failed' | 'success'
}

export function DataTableExport<T extends Record<string, unknown>>({
	columns,
	data,
	filename,
	resource,
	select = '*',
	transformData
}: DataTableExportProps<T>) {
	const [isExporting, setIsExporting] = useState(false)
	const [exportProgress, setExportProgress] = useState(0)
	const { open: notify } = useNotification()

	const fetchAllData = useCallback(async (): Promise<Array<T>> => {
		if (!resource) return data

		setExportProgress(10) // Show some initial progress

		const { data: allData, total } = await exportDataServer({
			data: {
				orderBy: 'created_at',
				resource,
				select
			}
		})

		setExportProgress(total > 0 ? 100 : 50)

		return transformData ? transformData(allData) : (allData as Array<T>)
	}, [resource, select, data, transformData])

	const handleExport = async (format: ExportFormat) => {
		try {
			setIsExporting(true)
			setExportProgress(0)

			const exportData = resource ? await fetchAllData() : data

			exportToFile(exportData, filename, format, columns)

			notify?.({
				message: `Exported ${exportData.length} records`,
				type: 'success'
			})
		} catch (error) {
			console.error('Export error:', error)
			notify?.({
				message: 'Failed to export data',
				type: 'error'
			})
		} finally {
			setIsExporting(false)
			setExportProgress(0)
		}
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button disabled={isExporting} size="sm" variant="outline">
						{isExporting ? (
							<Loader2 className="mr-2 size-4 animate-spin" />
						) : (
							<Download className="mr-2 size-4" />
						)}
						{isExporting ? 'Exporting...' : 'Export'}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => handleExport('xlsx')}>
						<FileSpreadsheet className="mr-2 size-4" />
						Export all as Excel (.xlsx)
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => handleExport('csv')}>
						<FileDown className="mr-2 size-4" />
						Export all as CSV (.csv)
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{isExporting && (
				<div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg w-72 z-50">
					<div className="flex items-center gap-2 mb-2">
						<Loader2 className="size-4 animate-spin text-primary" />
						<p className="text-sm font-medium">
							{exportProgress > 0 ? 'Fetching data...' : 'Preparing export...'}
						</p>
					</div>
					<Progress className="h-2" value={exportProgress} />
					<p className="text-xs text-muted-foreground mt-2">
						{exportProgress > 0 ? `${Math.round(exportProgress)}% complete` : 'Starting...'}
					</p>
				</div>
			)}
		</>
	)
}

export function DataTableImport<T extends Record<string, unknown>>({
	columns,
	excludeFields = [],
	onSuccess,
	relationships = [],
	resource,
	templateFilename,
	transformBeforeInsert,
	transformRow
}: DataTableImportProps<T>) {
	const [isOpen, setIsOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [isImporting, setIsImporting] = useState(false)
	const [previewData, setPreviewData] = useState<Array<Record<string, unknown>>>([])
	const [error, setError] = useState<null | string>(null)
	const [importProgress, setImportProgress] = useState(0)
	const [importResult, setImportResult] = useState<ImportResult | null>(null)
	const [validationErrors, setValidationErrors] = useState<Array<string>>([])
	const [isValidating, setIsValidating] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const { mutateAsync: createRecord } = useCreate()
	const { open: notify } = useNotification()

	// Validate relationship IDs exist in the database
	const validateRelationships = async (
		rows: Array<Record<string, unknown>>
	): Promise<{ errors: Array<string>; valid: boolean }> => {
		const errors: Array<string> = []

		for (const rel of relationships) {
			// Collect all unique IDs for this relationship
			const allIds = new Set<string>()

			for (const row of rows) {
				const value = row[rel.field]
				if (value) {
					const ids =
						typeof value === 'string' ? value.split(',').map((id) => id.trim()) : [String(value)]
					ids.forEach((id) => id && allIds.add(id))
				}
			}

			if (allIds.size === 0) continue

			// Check which IDs exist using server function
			const { missingIds } = await validateIdsServer({
				data: {
					ids: Array.from(allIds),
					resource: rel.resource
				}
			})

			if (missingIds.length > 0) {
				errors.push(
					`Invalid ${rel.field}: ${missingIds.slice(0, 5).join(', ')}${missingIds.length > 5 ? ` and ${missingIds.length - 5} more` : ''}`
				)
			}
		}

		return { errors, valid: errors.length === 0 }
	}

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		try {
			setError(null)
			setValidationErrors([])
			setImportResult(null)
			setIsLoading(true)

			const data = await parseFile(file)
			setPreviewData(data)
			setIsOpen(true)
			setIsLoading(false)

			// Validate relationships
			if (relationships.length > 0) {
				setIsValidating(true)
				const { errors } = await validateRelationships(data)
				setValidationErrors(errors)
				setIsValidating(false)
			}
		} catch (err) {
			setError('Failed to parse file. Please ensure it is a valid Excel or CSV file.')
			setIsLoading(false)
		}

		// Reset file input
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	// Parse error message from various error formats
	const parseErrorMessage = (err: unknown): string => {
		if (err && typeof err === 'object') {
			// Supabase/PostgreSQL error
			if ('message' in err && typeof (err as { message: string }).message === 'string') {
				const msg = (err as { message: string }).message
				const code = 'code' in err ? (err as { code: string }).code : ''

				// Make common errors more readable
				if (code === '23505') return 'Duplicate ID - record already exists'
				if (code === '23502') {
					const match = msg.match(/column "(\w+)"/)
					return match ? `Missing required field: ${match[1]}` : 'Missing required field'
				}
				if (code === '23503') {
					const match = msg.match(/Key \((\w+)\)=\(([^)]+)\)/)
					return match
						? `Invalid reference: ${match[1]}="${match[2]}" not found`
						: 'Invalid foreign key reference'
				}
				return msg
			}
			if (err instanceof Error) return err.message
		}
		return 'Unknown error'
	}

	const handleImport = async () => {
		setIsImporting(true)
		setImportProgress(0)

		const result: ImportResult = { errors: [], failed: 0, rowResults: [], success: 0 }

		// Create a mapping from header to key
		const headerToKey: Record<string, keyof T> = {}
		columns.forEach(({ header, key }) => {
			headerToKey[header] = key
		})

		// Get many-to-many relationship field names for exclusion (only those with junction tables)
		const manyToManyFields = new Set(
			relationships.filter((r) => r.isMany && r.junctionTable).map((r) => r.field)
		)
		const fieldsToExclude = new Set([...excludeFields, ...manyToManyFields])

		for (let i = 0; i < previewData.length; i++) {
			const row = previewData[i]

			try {
				// Transform row from headers back to keys
				let transformedRow: Partial<T> = {}
				const relationshipData: Record<string, Array<string>> = {}

				if (transformRow) {
					transformedRow = transformRow(row)
				} else {
					Object.entries(row).forEach(([header, value]) => {
						const key = headerToKey[header]
						if (key) {
							const keyStr = key as string

							// Check if this is a many-to-many relationship field
							if (manyToManyFields.has(keyStr)) {
								if (value) {
									const ids =
										typeof value === 'string'
											? value.split(',').map((v) => v.trim())
											: [String(value)]
									relationshipData[keyStr] = ids.filter(Boolean)
								}
							} else if (!fieldsToExclude.has(keyStr)) {
								// Handle regular fields (including simple foreign keys)
								if (
									typeof value === 'string' &&
									(value.toLowerCase() === 'true' || value.toLowerCase() === 'false')
								) {
									;(transformedRow as Record<string, unknown>)[keyStr] =
										value.toLowerCase() === 'true'
								} else {
									;(transformedRow as Record<string, unknown>)[keyStr] = value
								}
							}
						}
					})
				}

				// Check if we have an ID for upsert
				const hasId = 'id' in transformedRow && transformedRow.id

				// Remove id if it's empty (for new records)
				if ('id' in transformedRow && !transformedRow.id) {
					delete transformedRow.id
				}

				// Apply transform before insert if provided
				const finalRow = transformBeforeInsert
					? transformBeforeInsert(transformedRow as Record<string, unknown>)
					: transformedRow

				let newId: number | string | undefined

				// Use upsert if ID exists, otherwise create
				if (hasId) {
					const { data: upsertData } = await upsertServer({
						data: {
							resource,
							variables: finalRow
						}
					})

					newId = upsertData?.id
				} else {
					const createResult = await createRecord({
						errorNotification: false,
						resource,
						successNotification: false,
						values: finalRow
					})
					newId = createResult.data?.id as number | string | undefined
				}

				// Handle many-to-many relationships
				if (newId) {
					for (const rel of relationships) {
						if (rel.isMany && rel.junctionTable && relationshipData[rel.field]?.length) {
							const fkColumn = rel.junctionFk || `${resource.slice(0, -1)}_id`

							// Delete existing junction records first (for upsert case)
							if (hasId) {
								await deleteJunctionServer({
									data: {
										column: fkColumn,
										junctionTable: rel.junctionTable,
										value: String(newId)
									}
								})
							}

							const junctionRecords = relationshipData[rel.field].map((relatedId) => ({
								[fkColumn]: newId,
								[rel.junctionRelatedFk || `${rel.resource.slice(0, -1)}_id`]: relatedId
							}))

							await insertJunctionServer({
								data: {
									junctionTable: rel.junctionTable,
									records: junctionRecords
								}
							})
						}
					}
				}

				result.success++
				result.rowResults.push({ data: row, rowIndex: i, status: 'success' })
			} catch (err) {
				result.failed++
				const errorMsg = parseErrorMessage(err)
				result.errors.push(`Row ${i + 1}: ${errorMsg}`)
				result.rowResults.push({ data: row, error: errorMsg, rowIndex: i, status: 'failed' })
			}

			setImportProgress(((i + 1) / previewData.length) * 100)
		}

		setIsImporting(false)
		setImportResult(result)

		if (result.success > 0) {
			notify?.({
				message: `Successfully imported ${result.success} record${result.success > 1 ? 's' : ''}`,
				type: 'success'
			})
		}

		if (result.failed > 0) {
			notify?.({
				message: `Failed to import ${result.failed} record${result.failed > 1 ? 's' : ''}`,
				type: 'error'
			})
		}

		if (result.success > 0) {
			onSuccess?.()
		}
	}

	const handleDownloadTemplate = (format: ExportFormat) => {
		downloadTemplate(
			columns.map(({ example, header, key }) => ({
				example,
				header,
				key: String(key)
			})),
			templateFilename,
			format
		)
	}

	const handleClose = () => {
		setIsOpen(false)
		setPreviewData([])
		setError(null)
		setValidationErrors([])
		setImportResult(null)
		setImportProgress(0)
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button disabled={isLoading} size="sm" variant="outline">
						{isLoading ? (
							<Loader2 className="mr-2 size-4 animate-spin" />
						) : (
							<Upload className="mr-2 size-4" />
						)}
						{isLoading ? 'Loading...' : 'Import'}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
						<Upload className="mr-2 size-4" />
						Import from file
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => handleDownloadTemplate('xlsx')}>
						<FileSpreadsheet className="mr-2 size-4" />
						Download Excel template
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => handleDownloadTemplate('csv')}>
						<FileDown className="mr-2 size-4" />
						Download CSV template
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<input
				accept=".xlsx,.xls,.csv"
				className="hidden"
				onChange={handleFileSelect}
				ref={fileInputRef}
				type="file"
			/>

			<Dialog onOpenChange={handleClose} open={isOpen}>
				<DialogContent className="!max-w-[90vw] w-full min-h-[60vh] max-h-[90vh] overflow-hidden flex flex-col">
					<DialogHeader>
						<DialogTitle>Import Data</DialogTitle>
						<DialogDescription className="space-y-1">
							<span>
								{previewData.length} record{previewData.length !== 1 ? 's' : ''} found.
							</span>
							{!importResult && (
								<span className="flex items-center gap-1.5 text-xs">
									<Info className="size-3" />
									Records with existing IDs will be <strong>updated</strong>, new IDs will be{' '}
									<strong>created</strong>.
								</span>
							)}
						</DialogDescription>
					</DialogHeader>

					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm flex items-start gap-2">
							<AlertCircle className="size-4 mt-0.5 shrink-0" />
							{error}
						</div>
					)}

					{isValidating && (
						<div className="rounded-md bg-muted p-3 text-sm flex items-center gap-2">
							<Loader2 className="size-4 animate-spin text-primary" />
							<span>Validating relationships...</span>
						</div>
					)}

					{validationErrors.length > 0 && (
						<div className="rounded-md bg-yellow-500/10 p-3 text-yellow-600 dark:text-yellow-400 text-sm">
							<div className="flex items-start gap-2 mb-2">
								<AlertCircle className="size-4 mt-0.5 shrink-0" />
								<span className="font-medium">Some IDs don't exist in the database:</span>
							</div>
							<ul className="list-disc list-inside ml-6 space-y-1">
								{validationErrors.map((err, i) => (
									<li key={i}>{err}</li>
								))}
							</ul>
							<p className="mt-2 text-xs">
								These records will be skipped or created without the invalid relationships.
							</p>
						</div>
					)}

					{importResult && (
						<div
							className={`rounded-md p-4 text-sm ${
								importResult.failed > 0
									? 'bg-yellow-500/10 border border-yellow-500/20'
									: 'bg-green-500/10 border border-green-500/20'
							}`}
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex items-start gap-2">
									{importResult.failed > 0 ? (
										<AlertCircle className="size-5 mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400" />
									) : (
										<CheckCircle2 className="size-5 mt-0.5 shrink-0 text-green-600 dark:text-green-400" />
									)}
									<div>
										<p className="font-medium">Import complete</p>
										<div className="flex items-center gap-4 mt-1 text-sm">
											<span className="flex items-center gap-1 text-green-600 dark:text-green-400">
												<Check className="size-3.5" />
												{importResult.success} succeeded
											</span>
											{importResult.failed > 0 && (
												<span className="flex items-center gap-1 text-red-600 dark:text-red-400">
													<XCircle className="size-3.5" />
													{importResult.failed} failed
												</span>
											)}
										</div>
									</div>
								</div>
								{importResult.failed > 0 && (
									<Button
										onClick={() => {
											const failedRows = importResult.rowResults
												.filter((r) => r.status === 'failed')
												.map((r) => ({ ...r.data, _error: r.error }))
											exportToFile(failedRows, `${resource}-failed-imports`, 'xlsx')
										}}
										size="sm"
										variant="outline"
									>
										<Download className="mr-2 size-4" />
										Download failed rows
									</Button>
								)}
							</div>
						</div>
					)}

					{isImporting && (
						<div className="rounded-md bg-primary/5 border border-primary/20 p-4 space-y-3">
							<div className="flex items-center gap-2">
								<Loader2 className="size-4 animate-spin text-primary" />
								<p className="text-sm font-medium">Importing records...</p>
							</div>
							<Progress className="h-2" value={importProgress} />
							<p className="text-xs text-muted-foreground">
								{Math.round(importProgress)}% complete (
								{Math.round((importProgress / 100) * previewData.length)} of {previewData.length}{' '}
								records)
							</p>
						</div>
					)}

					<div className="flex-1 overflow-auto border rounded-md">
						<table className="w-full text-sm">
							<thead className="bg-muted sticky top-0 z-10">
								<tr>
									{importResult && (
										<th className="px-3 py-2 text-left font-medium border-b whitespace-nowrap w-24">
											Status
										</th>
									)}
									{previewData[0] &&
										Object.keys(previewData[0]).map((key) => (
											<th
												className="px-3 py-2 text-left font-medium border-b whitespace-nowrap"
												key={key}
											>
												{key}
											</th>
										))}
								</tr>
							</thead>
							<tbody>
								{previewData.slice(0, 100).map((row, index) => {
									const rowResult = importResult?.rowResults.find((r) => r.rowIndex === index)
									const isSuccess = rowResult?.status === 'success'
									const isFailed = rowResult?.status === 'failed'

									return (
										<tr
											className={`border-b last:border-0 ${
												isSuccess ? 'bg-green-500/5' : isFailed ? 'bg-red-500/10' : ''
											}`}
											key={index}
										>
											{importResult && (
												<td className="px-3 py-2">
													{isSuccess ? (
														<span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
															<Check className="size-3.5" />
															Success
														</span>
													) : isFailed ? (
														<span
															className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-medium cursor-help"
															title={rowResult?.error}
														>
															<XCircle className="size-3.5" />
															Failed
														</span>
													) : (
														<span className="text-muted-foreground text-xs">—</span>
													)}
												</td>
											)}
											{Object.values(row).map((value, i) => (
												<td className="px-3 py-2 max-w-xs truncate" key={i}>
													{String(value ?? '')}
												</td>
											))}
										</tr>
									)
								})}
							</tbody>
						</table>
						{previewData.length > 100 && (
							<div className="p-3 text-center text-muted-foreground text-sm bg-muted">
								Showing first 100 of {previewData.length} records
							</div>
						)}
					</div>

					<DialogFooter>
						<Button onClick={handleClose} variant="outline">
							{importResult ? 'Close' : 'Cancel'}
						</Button>
						{!importResult && (
							<Button
								disabled={isImporting || isValidating || validationErrors.length > 0}
								onClick={handleImport}
							>
								{isImporting ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Importing...
									</>
								) : isValidating ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Validating...
									</>
								) : (
									`Import ${previewData.length} records`
								)}
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}

DataTableExport.displayName = 'DataTableExport'
DataTableImport.displayName = 'DataTableImport'
