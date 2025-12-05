import type { BaseRecord, HttpError } from '@refinedev/core'
import type { UseTableReturnType } from '@refinedev/react-table'
import { startCase } from 'lodash-es'
import { Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export type TableColumnButtonProps<TData extends BaseRecord> = {
	table: UseTableReturnType<TData, HttpError>
}

export function TableColumnButton<TData extends BaseRecord>({
	table
}: TableColumnButtonProps<TData>) {
	const hidableColumns = table.reactTable.getAllColumns().filter((col) => col.getCanHide())

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
						checked={column.getIsVisible()}
						key={column.id}
						onCheckedChange={column.toggleVisibility}
					>
						{startCase(column.id)}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
