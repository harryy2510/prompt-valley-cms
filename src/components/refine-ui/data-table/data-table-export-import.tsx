import { useState, useRef } from 'react'
import { Download, Upload, FileSpreadsheet, FileDown } from 'lucide-react'
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
import { exportToFile, parseFile, downloadTemplate, ExportFormat } from '@/libs/excel'

export type ColumnMapping<T> = {
  key: keyof T
  header: string
  example?: string
}

export type DataTableExportProps<T extends Record<string, unknown>> = {
  data: T[]
  filename: string
  columns?: ColumnMapping<T>[]
}

export function DataTableExport<T extends Record<string, unknown>>({
  data,
  filename,
  columns,
}: DataTableExportProps<T>) {
  const handleExport = (format: ExportFormat) => {
    exportToFile(data, filename, format, columns)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 size-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('xlsx')}>
          <FileSpreadsheet className="mr-2 size-4" />
          Export as Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileDown className="mr-2 size-4" />
          Export as CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export type DataTableImportProps<T extends Record<string, unknown>> = {
  resource: string
  columns: ColumnMapping<T>[]
  templateFilename: string
  onSuccess?: () => void
  transformRow?: (row: Record<string, unknown>) => Partial<T>
}

export function DataTableImport<T extends Record<string, unknown>>({
  resource,
  columns,
  templateFilename,
  onSuccess,
  transformRow,
}: DataTableImportProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { mutateAsync: createRecord } = useCreate()
  const { open: notify } = useNotification()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setError(null)
      const data = await parseFile(file)
      setPreviewData(data)
      setIsOpen(true)
    } catch (err) {
      setError('Failed to parse file. Please ensure it is a valid Excel or CSV file.')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    let successCount = 0
    let errorCount = 0

    // Create a mapping from header to key
    const headerToKey: Record<string, keyof T> = {}
    columns.forEach(({ key, header }) => {
      headerToKey[header] = key
    })

    for (const row of previewData) {
      try {
        // Transform row from headers back to keys
        let transformedRow: Partial<T> = {}

        if (transformRow) {
          transformedRow = transformRow(row)
        } else {
          Object.entries(row).forEach(([header, value]) => {
            const key = headerToKey[header]
            if (key) {
              // Handle comma-separated values for arrays
              if (typeof value === 'string' && value.includes(',')) {
                ;(transformedRow as Record<string, unknown>)[key as string] = value
                  .split(',')
                  .map((v) => v.trim())
              } else {
                ;(transformedRow as Record<string, unknown>)[key as string] = value
              }
            }
          })
        }

        await createRecord({
          resource,
          values: transformedRow,
          successNotification: false,
          errorNotification: false,
        })
        successCount++
      } catch {
        errorCount++
      }
    }

    setIsImporting(false)
    setIsOpen(false)
    setPreviewData([])

    if (successCount > 0) {
      notify?.({
        type: 'success',
        message: `Successfully imported ${successCount} record${successCount > 1 ? 's' : ''}`,
      })
    }

    if (errorCount > 0) {
      notify?.({
        type: 'error',
        message: `Failed to import ${errorCount} record${errorCount > 1 ? 's' : ''}`,
      })
    }

    onSuccess?.()
  }

  const handleDownloadTemplate = (format: ExportFormat) => {
    downloadTemplate(
      columns.map(({ key, header, example }) => ({
        key: String(key),
        header,
        example,
      })),
      templateFilename,
      format,
    )
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              Preview the data before importing. {previewData.length} record
              {previewData.length !== 1 ? 's' : ''} found.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
              {error}
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
                        className="px-3 py-2 text-left font-medium border-b"
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
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? 'Importing...' : `Import ${previewData.length} records`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

DataTableExport.displayName = 'DataTableExport'
DataTableImport.displayName = 'DataTableImport'
