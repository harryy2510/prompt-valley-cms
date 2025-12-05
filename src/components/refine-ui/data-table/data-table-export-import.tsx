import { useState, useRef, useCallback } from 'react'
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Check,
  Info,
} from 'lucide-react'
import { useCreate, useNotification } from '@refinedev/core'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import {
  exportToFile,
  parseFile,
  downloadTemplate,
  ExportFormat,
} from '@/libs/excel'
import { supabase } from '@/libs/supabase'

export type ColumnMapping<T> = {
  key: keyof T
  header: string
  example?: string
}

export type DataTableExportProps<T extends Record<string, unknown>> = {
  data: T[]
  filename: string
  columns?: ColumnMapping<T>[]
  /** Resource name for fetching all data */
  resource?: string
  /** Select query for Supabase (e.g., '*, categories(id, name)') */
  select?: string
  /** Transform function to convert raw data to export format */
  transformData?: (data: unknown[]) => T[]
}

export function DataTableExport<T extends Record<string, unknown>>({
  data,
  filename,
  columns,
  resource,
  select = '*',
  transformData,
}: DataTableExportProps<T>) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const { open: notify } = useNotification()

  const fetchAllData = useCallback(async (): Promise<T[]> => {
    if (!resource) return data

    const PAGE_SIZE = 1000
    let allData: unknown[] = []
    let page = 0
    let hasMore = true

    // First, get total count
    const { count } = await supabase
      .from(resource)
      .select('*', { count: 'exact', head: true })

    const totalCount = count || 0

    while (hasMore) {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data: pageData, error } = await supabase
        .from(resource)
        .select(select)
        .range(from, to)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      if (pageData && pageData.length > 0) {
        allData = [...allData, ...pageData]
        setExportProgress(Math.min(100, (allData.length / totalCount) * 100))
      }

      hasMore = pageData && pageData.length === PAGE_SIZE
      page++
    }

    return transformData ? transformData(allData) : (allData as T[])
  }, [resource, select, data, transformData])

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true)
      setExportProgress(0)

      const exportData = resource ? await fetchAllData() : data

      exportToFile(exportData, filename, format, columns)

      notify?.({
        type: 'success',
        message: `Exported ${exportData.length} records`,
      })
    } catch (error) {
      console.error('Export error:', error)
      notify?.({
        type: 'error',
        message: 'Failed to export data',
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
          <Button variant="outline" size="sm" disabled={isExporting}>
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
          <Progress value={exportProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {exportProgress > 0 ? `${Math.round(exportProgress)}% complete` : 'Starting...'}
          </p>
        </div>
      )}
    </>
  )
}

type RelationshipConfig = {
  /** The field name in import data (e.g., 'tag_ids') */
  field: string
  /** The resource to validate against (e.g., 'tags') */
  resource: string
  /** Whether this is a many-to-many relationship */
  isMany?: boolean
  /** Junction table for many-to-many (e.g., 'prompt_tags') */
  junctionTable?: string
  /** Foreign key in junction table pointing to main resource (e.g., 'prompt_id') */
  junctionFk?: string
  /** Foreign key in junction table pointing to related resource (e.g., 'tag_id') */
  junctionRelatedFk?: string
}

export type DataTableImportProps<T extends Record<string, unknown>> = {
  resource: string
  columns: ColumnMapping<T>[]
  templateFilename: string
  onSuccess?: () => void
  transformRow?: (row: Record<string, unknown>) => Partial<T>
  /** Configuration for relationship fields */
  relationships?: RelationshipConfig[]
  /** Fields to exclude from main record creation (handled separately) */
  excludeFields?: string[]
  /** Transform data before inserting into database (after field mapping) */
  transformBeforeInsert?: (row: Record<string, unknown>) => Record<string, unknown>
}

type RowResult = {
  rowIndex: number
  status: 'success' | 'failed'
  error?: string
  data: Record<string, unknown>
}

type ImportResult = {
  success: number
  failed: number
  errors: string[]
  rowResults: RowResult[]
}

export function DataTableImport<T extends Record<string, unknown>>({
  resource,
  columns,
  templateFilename,
  onSuccess,
  transformRow,
  relationships = [],
  excludeFields = [],
  transformBeforeInsert,
}: DataTableImportProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([])
  const [error, setError] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { mutateAsync: createRecord } = useCreate()
  const { open: notify } = useNotification()

  // Validate relationship IDs exist in the database
  const validateRelationships = async (
    rows: Record<string, unknown>[]
  ): Promise<{ valid: boolean; errors: string[] }> => {
    const errors: string[] = []

    for (const rel of relationships) {
      // Collect all unique IDs for this relationship
      const allIds = new Set<string>()

      for (const row of rows) {
        const value = row[rel.field]
        if (value) {
          const ids =
            typeof value === 'string'
              ? value.split(',').map((id) => id.trim())
              : [String(value)]
          ids.forEach((id) => id && allIds.add(id))
        }
      }

      if (allIds.size === 0) continue

      // Check which IDs exist
      const { data: existingRecords } = await supabase
        .from(rel.resource)
        .select('id')
        .in('id', Array.from(allIds))

      const existingIds = new Set(existingRecords?.map((r) => r.id) || [])
      const missingIds = Array.from(allIds).filter((id) => !existingIds.has(id))

      if (missingIds.length > 0) {
        errors.push(
          `Invalid ${rel.field}: ${missingIds.slice(0, 5).join(', ')}${missingIds.length > 5 ? ` and ${missingIds.length - 5} more` : ''}`
        )
      }
    }

    return { valid: errors.length === 0, errors }
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
      setError(
        'Failed to parse file. Please ensure it is a valid Excel or CSV file.'
      )
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
          return match ? `Invalid reference: ${match[1]}="${match[2]}" not found` : 'Invalid foreign key reference'
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

    const result: ImportResult = { success: 0, failed: 0, errors: [], rowResults: [] }

    // Create a mapping from header to key
    const headerToKey: Record<string, keyof T> = {}
    columns.forEach(({ key, header }) => {
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
        const relationshipData: Record<string, string[]> = {}

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
                  (value.toLowerCase() === 'true' ||
                    value.toLowerCase() === 'false')
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

        let newId: string | number | undefined

        // Use upsert if ID exists, otherwise create
        if (hasId) {
          const { data: upsertData, error: upsertError } = await supabase
            .from(resource)
            .upsert(finalRow as Record<string, unknown>)
            .select('id')
            .single()

          if (upsertError) throw upsertError
          newId = upsertData?.id
        } else {
          const createResult = await createRecord({
            resource,
            values: finalRow,
            successNotification: false,
            errorNotification: false,
          })
          newId = createResult.data?.id as string | number | undefined
        }

        // Handle many-to-many relationships
        if (newId) {
          for (const rel of relationships) {
            if (
              rel.isMany &&
              rel.junctionTable &&
              relationshipData[rel.field]?.length
            ) {
              // Delete existing junction records first (for upsert case)
              if (hasId) {
                await supabase
                  .from(rel.junctionTable)
                  .delete()
                  .eq(rel.junctionFk || `${resource.slice(0, -1)}_id`, newId)
              }

              const junctionRecords = relationshipData[rel.field].map((relatedId) => ({
                [rel.junctionFk || `${resource.slice(0, -1)}_id`]: newId,
                [rel.junctionRelatedFk || `${rel.resource.slice(0, -1)}_id`]: relatedId,
              }))

              await supabase.from(rel.junctionTable).insert(junctionRecords)
            }
          }
        }

        result.success++
        result.rowResults.push({ rowIndex: i, status: 'success', data: row })
      } catch (err) {
        result.failed++
        const errorMsg = parseErrorMessage(err)
        result.errors.push(`Row ${i + 1}: ${errorMsg}`)
        result.rowResults.push({ rowIndex: i, status: 'failed', error: errorMsg, data: row })
      }

      setImportProgress(((i + 1) / previewData.length) * 100)
    }

    setIsImporting(false)
    setImportResult(result)

    if (result.success > 0) {
      notify?.({
        type: 'success',
        message: `Successfully imported ${result.success} record${result.success > 1 ? 's' : ''}`,
      })
    }

    if (result.failed > 0) {
      notify?.({
        type: 'error',
        message: `Failed to import ${result.failed} record${result.failed > 1 ? 's' : ''}`,
      })
    }

    if (result.success > 0) {
      onSuccess?.()
    }
  }

  const handleDownloadTemplate = (format: ExportFormat) => {
    downloadTemplate(
      columns.map(({ key, header, example }) => ({
        key: String(key),
        header,
        example,
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
          <Button variant="outline" size="sm" disabled={isLoading}>
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
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Dialog open={isOpen} onOpenChange={handleClose}>
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
                  Records with existing IDs will be <strong>updated</strong>, new IDs will be <strong>created</strong>.
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
                <span className="font-medium">
                  Some IDs don't exist in the database:
                </span>
              </div>
              <ul className="list-disc list-inside ml-6 space-y-1">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs">
                These records will be skipped or created without the invalid
                relationships.
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
                    <p className="font-medium">
                      Import complete
                    </p>
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
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const failedRows = importResult.rowResults
                        .filter((r) => r.status === 'failed')
                        .map((r) => ({ ...r.data, _error: r.error }))
                      exportToFile(failedRows, `${resource}-failed-imports`, 'xlsx')
                    }}
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
                <p className="text-sm font-medium">
                  Importing records...
                </p>
              </div>
              <Progress value={importProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {Math.round(importProgress)}% complete ({Math.round((importProgress / 100) * previewData.length)} of {previewData.length} records)
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
                        key={key}
                        className="px-3 py-2 text-left font-medium border-b whitespace-nowrap"
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
                      key={index}
                      className={`border-b last:border-0 ${
                        isSuccess
                          ? 'bg-green-500/5'
                          : isFailed
                          ? 'bg-red-500/10'
                          : ''
                      }`}
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
                        <td key={i} className="px-3 py-2 max-w-xs truncate">
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
            <Button variant="outline" onClick={handleClose}>
              {importResult ? 'Close' : 'Cancel'}
            </Button>
            {!importResult && (
              <Button
                onClick={handleImport}
                disabled={isImporting || isValidating || validationErrors.length > 0}
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
