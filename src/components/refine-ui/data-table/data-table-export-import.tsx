import { useState, useRef, useCallback } from 'react'
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
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

      {isExporting && exportProgress > 0 && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg w-64">
          <p className="text-sm mb-2">Fetching data...</p>
          <Progress value={exportProgress} />
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

type ImportResult = {
  success: number
  failed: number
  errors: string[]
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
  const [isImporting, setIsImporting] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([])
  const [error, setError] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
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
      const data = await parseFile(file)
      setPreviewData(data)
      setIsOpen(true)

      // Validate relationships
      if (relationships.length > 0) {
        const { errors } = await validateRelationships(data)
        setValidationErrors(errors)
      }
    } catch (err) {
      setError(
        'Failed to parse file. Please ensure it is a valid Excel or CSV file.'
      )
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    setImportProgress(0)

    const result: ImportResult = { success: 0, failed: 0, errors: [] }

    // Create a mapping from header to key
    const headerToKey: Record<string, keyof T> = {}
    columns.forEach(({ key, header }) => {
      headerToKey[header] = key
    })

    // Get relationship field names for exclusion
    const relationshipFields = new Set(relationships.map((r) => r.field))
    const fieldsToExclude = new Set([...excludeFields, ...relationshipFields])

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

              // Check if this is a relationship field
              if (relationshipFields.has(keyStr)) {
                if (value) {
                  const ids =
                    typeof value === 'string'
                      ? value.split(',').map((v) => v.trim())
                      : [String(value)]
                  relationshipData[keyStr] = ids.filter(Boolean)
                }
              } else if (!fieldsToExclude.has(keyStr)) {
                // Handle regular fields
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

        // Remove id if it's empty (for new records)
        if ('id' in transformedRow && !transformedRow.id) {
          delete transformedRow.id
        }

        // Apply transform before insert if provided
        const finalRow = transformBeforeInsert
          ? transformBeforeInsert(transformedRow as Record<string, unknown>)
          : transformedRow

        // Create main record
        const createResult = await createRecord({
          resource,
          values: finalRow,
          successNotification: false,
          errorNotification: false,
        })

        const newId = createResult.data?.id

        // Handle many-to-many relationships
        if (newId) {
          for (const rel of relationships) {
            if (
              rel.isMany &&
              rel.junctionTable &&
              relationshipData[rel.field]?.length
            ) {
              const junctionRecords = relationshipData[rel.field].map((relatedId) => ({
                [rel.junctionFk || `${resource.slice(0, -1)}_id`]: newId,
                [rel.junctionRelatedFk || `${rel.resource.slice(0, -1)}_id`]: relatedId,
              }))

              await supabase.from(rel.junctionTable).insert(junctionRecords)
            }
          }
        }

        result.success++
      } catch (err) {
        result.failed++
        const errorMsg =
          err instanceof Error ? err.message : 'Unknown error'
        if (result.errors.length < 10) {
          result.errors.push(`Row ${i + 1}: ${errorMsg}`)
        }
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
          <Button variant="outline" size="sm">
            <Upload className="mr-2 size-4" />
            Import
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              Preview and import data. {previewData.length} record
              {previewData.length !== 1 ? 's' : ''} found.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm flex items-start gap-2">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              {error}
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
              className={`rounded-md p-3 text-sm flex items-start gap-2 ${
                importResult.failed > 0
                  ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                  : 'bg-green-500/10 text-green-600 dark:text-green-400'
              }`}
            >
              <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
              <div>
                <p>
                  Import complete: {importResult.success} succeeded,{' '}
                  {importResult.failed} failed
                </p>
                {importResult.errors.length > 0 && (
                  <ul className="list-disc list-inside mt-2 text-xs">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {isImporting && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Importing records...
              </p>
              <Progress value={importProgress} />
            </div>
          )}

          <div className="flex-1 overflow-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
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
                {previewData.slice(0, 100).map((row, index) => (
                  <tr key={index} className="border-b last:border-0">
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="px-3 py-2 max-w-xs truncate">
                        {String(value ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
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
                disabled={isImporting || validationErrors.length > 0}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Importing...
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
