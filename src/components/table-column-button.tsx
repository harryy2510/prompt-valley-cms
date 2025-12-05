import { UseTableReturnType } from '@refinedev/react-table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Settings2 } from 'lucide-react'
import { startCase } from 'lodash-es'
import { BaseRecord, HttpError } from '@refinedev/core'

export type TableColumnButtonProps<TData extends BaseRecord> = {
  table: UseTableReturnType<TData, HttpError>
}

export function TableColumnButton<TData extends BaseRecord>({
  table,
}: TableColumnButtonProps<TData>) {
  const hidableColumns = table.reactTable
    .getAllColumns()
    .filter((col) => col.getCanHide())

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Settings2 className="size-4 mr-2" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {hidableColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={column.toggleVisibility}
          >
            {startCase(column.id)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
