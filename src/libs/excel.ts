import * as XLSX from 'xlsx'

export type ExportFormat = 'xlsx' | 'csv'

/**
 * Export data to Excel or CSV file
 */
export function exportToFile<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  format: ExportFormat = 'xlsx',
  columns?: { key: keyof T; header: string }[],
) {
  if (data.length === 0) {
    console.warn('No data to export')
    return
  }

  // If columns are specified, transform data to only include those columns with custom headers
  let exportData: Record<string, unknown>[]
  if (columns) {
    exportData = data.map((row) => {
      const newRow: Record<string, unknown> = {}
      columns.forEach(({ key, header }) => {
        const value = row[key]
        // Handle arrays by joining them
        if (Array.isArray(value)) {
          newRow[header] = value.join(', ')
        } else {
          newRow[header] = value
        }
      })
      return newRow
    })
  } else {
    exportData = data.map((row) => {
      const newRow: Record<string, unknown> = {}
      Object.entries(row).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          newRow[key] = value.join(', ')
        } else {
          newRow[key] = value
        }
      })
      return newRow
    })
  }

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

  // Auto-size columns
  const maxWidth = 50
  const colWidths = Object.keys(exportData[0] || {}).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...exportData.map((row) => String(row[key] ?? '').length),
    )
    return { wch: Math.min(maxLength + 2, maxWidth) }
  })
  worksheet['!cols'] = colWidths

  const extension = format === 'xlsx' ? 'xlsx' : 'csv'
  const bookType = format === 'xlsx' ? 'xlsx' : 'csv'

  XLSX.writeFile(workbook, `${filename}.${extension}`, { bookType })
}

/**
 * Parse Excel or CSV file and return data
 */
export async function parseFile<T = Record<string, unknown>>(
  file: File,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<T>(worksheet)
        resolve(jsonData)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * Download a template file with specified columns
 */
export function downloadTemplate(
  columns: { key: string; header: string; example?: string }[],
  filename: string,
  format: ExportFormat = 'xlsx',
) {
  const exampleRow: Record<string, string> = {}
  columns.forEach(({ header, example }) => {
    exampleRow[header] = example ?? ''
  })

  const worksheet = XLSX.utils.json_to_sheet([exampleRow])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')

  // Auto-size columns
  const colWidths = columns.map(({ header, example }) => {
    const maxLength = Math.max(header.length, (example ?? '').length)
    return { wch: maxLength + 2 }
  })
  worksheet['!cols'] = colWidths

  const extension = format === 'xlsx' ? 'xlsx' : 'csv'
  const bookType = format === 'xlsx' ? 'xlsx' : 'csv'

  XLSX.writeFile(workbook, `${filename}-template.${extension}`, { bookType })
}
