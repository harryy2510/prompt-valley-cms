import type { BaseRecord, HttpError } from '@refinedev/core'
import { useNavigation, useNotification } from '@refinedev/core'
import type { UseTableReturnType } from '@refinedev/react-table'
import type { Column, RowSelectionState } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import { Copy, Eye, Loader2, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Selecto from 'react-selecto'

import { DataTablePagination } from '@/components/refine-ui/data-table/data-table-pagination'
import { ActionButton } from '@/components/ui/action-button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import { cn } from '@/libs/cn'

// Fixed width for checkbox column to prevent layout shifts
const CHECKBOX_COLUMN_WIDTH = 40

type ContextMenuAction<TData> = {
	hidden?: (row: TData) => boolean
	icon?: ReactNode
	label: string
	onClick: (row: TData) => void
	variant?: 'default' | 'destructive'
}

type DataTableProps<TData extends BaseRecord> = {
	/** Custom context menu actions */
	contextMenuActions?: Array<ContextMenuAction<TData>>
	/** Disable default context menu */
	disableContextMenu?: boolean
	/** Enable row selection with checkboxes */
	enableSelection?: boolean
	/** Custom delete handler */
	onDelete?: (row: TData) => Promise<void>
	/** Bulk delete handler for selected rows */
	onDeleteMany?: (rows: Array<TData>) => Promise<void>
	/** Resource name for default context menu actions (view, edit, delete) */
	resource?: string
	table: UseTableReturnType<TData, HttpError>
}

export function DataTable<TData extends BaseRecord>({
	contextMenuActions = [],
	disableContextMenu = false,
	enableSelection = false,
	onDelete,
	onDeleteMany,
	resource,
	table
}: DataTableProps<TData>) {
	const {
		reactTable: { getAllColumns, getHeaderGroups, getRowModel },
		refineCore: { currentPage, pageCount, pageSize, setCurrentPage, setPageSize, tableQuery }
	} = table

	const { edit, show } = useNavigation()
	const { open: notify } = useNotification()

	const columns = getAllColumns()
	const leafColumns = table.reactTable.getAllLeafColumns()
	const isLoading = tableQuery.isLoading

	const tableContainerRef = useRef<HTMLDivElement>(null)
	const tableRef = useRef<HTMLTableElement>(null)
	const selectoRef = useRef<Selecto>(null)
	const shiftKeyRef = useRef(false)
	const [isOverflowing, setIsOverflowing] = useState({
		horizontal: false,
		vertical: false
	})

	// Track shift key state globally for checkbox click handlers
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Shift') shiftKeyRef.current = true
		}
		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.key === 'Shift') shiftKeyRef.current = false
		}
		window.addEventListener('keydown', handleKeyDown)
		window.addEventListener('keyup', handleKeyUp)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
			window.removeEventListener('keyup', handleKeyUp)
		}
	}, [])

	// Row selection state
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
	const [lastSelectedRowId, setLastSelectedRowId] = useState<null | string>(null)

	// Get selected rows data
	const selectedRowIds = Object.keys(rowSelection).filter((key) => rowSelection[key])
	const selectedRows = getRowModel().rows
		.filter((row) => selectedRowIds.includes(row.id))
		.map((row) => row.original)

	// Check if all visible rows are selected
	const allRowsSelected =
		getRowModel().rows.length > 0 &&
		getRowModel().rows.every((row) => rowSelection[row.id])
	const someRowsSelected = selectedRowIds.length > 0 && !allRowsSelected

	// Toggle all rows selection
	// Standard behavior: unchecked/indeterminate → select all, checked → clear all
	const toggleAllRows = () => {
		if (allRowsSelected) {
			// All selected → clear all
			setRowSelection({})
			setLastSelectedRowId(null)
		} else {
			// None or some selected → select all
			const newSelection: RowSelectionState = {}
			getRowModel().rows.forEach((row) => {
				newSelection[row.id] = true
			})
			setRowSelection(newSelection)
		}
	}

	// Toggle single row selection with shift-select support
	const toggleRow = (rowId: string, shiftKey = false) => {
		const rows = getRowModel().rows

		if (shiftKey && lastSelectedRowId && lastSelectedRowId !== rowId) {
			// Shift-select: select range between last selected and current
			const allRowIds = rows.map((r) => r.id)
			const lastIndex = allRowIds.indexOf(lastSelectedRowId)
			const currentIndex = allRowIds.indexOf(rowId)

			if (lastIndex !== -1 && currentIndex !== -1) {
				const start = Math.min(lastIndex, currentIndex)
				const end = Math.max(lastIndex, currentIndex)

				setRowSelection((prev) => {
					const newSelection = { ...prev }
					for (let i = start; i <= end; i++) {
						newSelection[allRowIds[i]] = true
					}
					return newSelection
				})
			}
		} else {
			// Normal toggle
			setRowSelection((prev) => ({
				...prev,
				[rowId]: !prev[rowId]
			}))
		}

		setLastSelectedRowId(rowId)
	}

	// Clear selection when data changes
	useEffect(() => {
		setRowSelection({})
		setLastSelectedRowId(null)
	}, [tableQuery.data?.data])

	// Handle bulk delete
	const handleBulkDelete = async () => {
		if (onDeleteMany && selectedRows.length > 0) {
			await onDeleteMany(selectedRows)
			setRowSelection({})
		}
		return { error: false }
	}

	const handleCopyId = (id: number | string) => {
		void navigator.clipboard.writeText(String(id))
		notify?.({
			message: 'ID copied to clipboard',
			type: 'success'
		})
	}

	useEffect(() => {
		const checkOverflow = () => {
			if (tableRef.current && tableContainerRef.current) {
				const tableElem = tableRef.current
				const containerElem = tableContainerRef.current

				const horizontalOverflow = tableElem.offsetWidth > containerElem.clientWidth
				const verticalOverflow = tableElem.offsetHeight > containerElem.clientHeight

				setIsOverflowing({
					horizontal: horizontalOverflow,
					vertical: verticalOverflow
				})
			}
		}

		checkOverflow()

		// Check on window resize
		window.addEventListener('resize', checkOverflow)

		// Check when table data changes
		const timeoutId = setTimeout(checkOverflow, 100)

		return () => {
			window.removeEventListener('resize', checkOverflow)
			clearTimeout(timeoutId)
		}
	}, [tableQuery.data?.data, pageSize])

	return (
		<div className={cn('flex', 'flex-col', 'flex-1', 'gap-4')}>
			<div className={cn('rounded-md', 'border')} ref={tableContainerRef}>
				<Table ref={tableRef} style={{ tableLayout: 'fixed', width: '100%' }}>
					<TableHeader>
						{getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{enableSelection && (
									<TableHead
										style={{
											width: CHECKBOX_COLUMN_WIDTH,
											minWidth: CHECKBOX_COLUMN_WIDTH,
											maxWidth: CHECKBOX_COLUMN_WIDTH
										}}
									>
										<div className="flex items-center justify-center">
											<Checkbox
												aria-label="Select all"
												checked={allRowsSelected ? true : someRowsSelected ? 'indeterminate' : false}
												onCheckedChange={toggleAllRows}
											/>
										</div>
									</TableHead>
								)}
								{headerGroup.headers.map((header) => {
									const isPlaceholder = header.isPlaceholder

									return (
										<TableHead
											key={header.id}
											style={{
												...getCommonStyles({
													column: header.column,
													isOverflowing: isOverflowing
												})
											}}
										>
											{isPlaceholder ? null : (
												<div className={cn('flex', 'items-center', 'gap-1')}>
													{flexRender(header.column.columnDef.header, header.getContext())}
												</div>
											)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody className="relative">
						{isLoading ? (
							<>
								{Array.from({ length: pageSize < 1 ? 1 : pageSize }).map((_, rowIndex) => (
									<TableRow aria-hidden="true" key={`skeleton-row-${rowIndex}`}>
										{enableSelection && (
											<TableCell
												style={{
													width: CHECKBOX_COLUMN_WIDTH,
													minWidth: CHECKBOX_COLUMN_WIDTH,
													maxWidth: CHECKBOX_COLUMN_WIDTH
												}}
											>
												<div className="h-8" />
											</TableCell>
										)}
										{leafColumns.map((column) => (
											<TableCell
												className={cn('truncate')}
												key={`skeleton-cell-${rowIndex}-${column.id}`}
												style={{
													...getCommonStyles({
														column,
														isOverflowing: isOverflowing
													})
												}}
											>
												<div className="h-8" />
											</TableCell>
										))}
									</TableRow>
								))}
								<TableRow>
									<TableCell
										className={cn('absolute', 'inset-0', 'pointer-events-none')}
										colSpan={columns.length + (enableSelection ? 1 : 0)}
									>
										<Loader2
											className={cn(
												'absolute',
												'top-1/2',
												'left-1/2',
												'animate-spin',
												'text-primary',
												'h-8',
												'w-8',
												'-translate-x-1/2',
												'-translate-y-1/2'
											)}
										/>
									</TableCell>
								</TableRow>
							</>
						) : getRowModel().rows?.length ? (
							getRowModel().rows.map((row) => {
								const isSelected = rowSelection[row.id]
								const rowContent = (
									<TableRow
										className={cn(
											!disableContextMenu && 'cursor-context-menu',
											isSelected && 'bg-muted/50',
											enableSelection && 'selectable-row',
											enableSelection && selectedRowIds.length > 0 && 'cursor-pointer'
										)}
										data-row-id={row.id}
										data-state={isSelected ? 'selected' : undefined}
										key={row.original?.id ?? row.id}
										onClick={(e) => {
											// Only toggle on row click if selection mode is active (at least one row selected)
											if (enableSelection && selectedRowIds.length > 0) {
												// Don't toggle if clicking on a button, link, or checkbox
												const target = e.target as HTMLElement
												if (target.closest('button, a, [role="checkbox"], input')) return
												toggleRow(row.id, shiftKeyRef.current)
											}
										}}
									>
										{enableSelection && (
											<TableCell
												style={{
													width: CHECKBOX_COLUMN_WIDTH,
													minWidth: CHECKBOX_COLUMN_WIDTH,
													maxWidth: CHECKBOX_COLUMN_WIDTH
												}}
											>
												<div className="flex items-center justify-center">
													<Checkbox
														aria-label={`Select row ${row.id}`}
														checked={isSelected ? true : false}
														onCheckedChange={() => {
															toggleRow(row.id, shiftKeyRef.current)
														}}
													/>
												</div>
											</TableCell>
										)}
										{row.getVisibleCells().map((cell) => {
											return (
												<TableCell
													key={cell.id}
													style={{
														...getCommonStyles({
															column: cell.column,
															isOverflowing: isOverflowing
														})
													}}
												>
													<div className="truncate">
														{flexRender(cell.column.columnDef.cell, cell.getContext())}
													</div>
												</TableCell>
											)
										})}
									</TableRow>
								)

								if (disableContextMenu) {
									return rowContent
								}

								return (
									<ContextMenu key={row.original?.id ?? row.id}>
										<ContextMenuTrigger asChild>{rowContent}</ContextMenuTrigger>
										<ContextMenuContent className="w-48">
											{resource && row.original.id && (
												<>
													<ContextMenuItem onClick={() => show(resource, row.original.id!)}>
														<Eye className="size-4 mr-2" />
														View
													</ContextMenuItem>
													<ContextMenuItem onClick={() => edit(resource, row.original.id!)}>
														<Pencil className="size-4 mr-2" />
														Edit
													</ContextMenuItem>
												</>
											)}
											{row.original.id && (
												<ContextMenuItem onClick={() => handleCopyId(row.original.id!)}>
													<Copy className="size-4 mr-2" />
													Copy ID
												</ContextMenuItem>
											)}
											{contextMenuActions.map((action, idx) => {
												if (action.hidden?.(row.original)) return null
												return (
													<ContextMenuItem
														key={idx}
														onClick={() => action.onClick(row.original)}
														variant={action.variant}
													>
														{action.icon}
														{action.label}
													</ContextMenuItem>
												)
											})}
											{(resource || onDelete) && <ContextMenuSeparator />}
											{onDelete && (
												<ContextMenuItem
													onClick={() => onDelete(row.original)}
													variant="destructive"
												>
													<Trash2 className="size-4 mr-2" />
													Delete
												</ContextMenuItem>
											)}
										</ContextMenuContent>
									</ContextMenu>
								)
							})
						) : (
							<DataTableNoData
								columnsLength={columns.length + (enableSelection ? 1 : 0)}
								isOverflowing={isOverflowing}
							/>
						)}
					</TableBody>
				</Table>

				{/* Selecto for drag selection */}
				{enableSelection && !isLoading && getRowModel().rows?.length > 0 && (
					<Selecto
						container={tableContainerRef.current}
						continueSelect={false}
						hitRate={0}
						onSelect={(e) => {
							setRowSelection((prev) => {
								const newSelection = { ...prev }

								e.added.forEach((el) => {
									const rowId = el.getAttribute('data-row-id')
									if (rowId) newSelection[rowId] = true
								})

								e.removed.forEach((el) => {
									const rowId = el.getAttribute('data-row-id')
									if (rowId) delete newSelection[rowId]
								})

								return newSelection
							})
						}}
						ref={selectoRef}
						selectableTargets={['.selectable-row']}
						selectByClick={false}
						selectFromInside={false}
						toggleContinueSelect="shift"
					/>
				)}
			</div>
			{/* Selection bar with bulk delete */}
			{enableSelection && selectedRows.length > 0 && (
				<div className="flex items-center justify-between px-2 py-2 bg-muted/50 rounded-md border">
					<span className="text-sm text-muted-foreground">
						{selectedRows.length} row{selectedRows.length > 1 ? 's' : ''} selected
					</span>
					<div className="flex items-center gap-2">
						<button
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
							onClick={() => setRowSelection({})}
							type="button"
						>
							Clear selection
						</button>
						{onDeleteMany && (
							<ActionButton
								action={handleBulkDelete}
								areYouSureDescription={`This will permanently delete ${selectedRows.length} item${selectedRows.length > 1 ? 's' : ''}. This action cannot be undone.`}
								areYouSureTitle={`Delete ${selectedRows.length} item${selectedRows.length > 1 ? 's' : ''}?`}
								className="h-8"
								confirmLabel="Delete"
								requireAreYouSure
								size="sm"
								variant="destructive"
							>
								<Trash2 className="size-4 mr-2" />
								Delete selected
							</ActionButton>
						)}
					</div>
				</div>
			)}
			{!isLoading && getRowModel().rows?.length > 0 && (
				<DataTablePagination
					currentPage={currentPage}
					pageCount={pageCount}
					pageSize={pageSize}
					setCurrentPage={setCurrentPage}
					setPageSize={setPageSize}
					total={tableQuery.data?.total}
				/>
			)}
		</div>
	)
}

export function getCommonStyles<TData>({
	column,
	isOverflowing
}: {
	column: Column<TData>
	isOverflowing: {
		horizontal: boolean
		vertical: boolean
	}
}): React.CSSProperties {
	const isPinned = column.getIsPinned()
	const isLastLeftPinnedColumn = isPinned === 'left' && column.getIsLastColumn('left')
	const isFirstRightPinnedColumn = isPinned === 'right' && column.getIsFirstColumn('right')

	return {
		background: isOverflowing.horizontal && isPinned ? 'var(--background)' : '',
		borderBottomLeftRadius:
			isOverflowing.horizontal && isPinned === 'left' ? 'var(--radius)' : undefined,
		borderBottomRightRadius:
			isOverflowing.horizontal && isPinned === 'right' ? 'var(--radius)' : undefined,
		borderTopLeftRadius:
			isOverflowing.horizontal && isPinned === 'left' ? 'var(--radius)' : undefined,
		borderTopRightRadius:
			isOverflowing.horizontal && isPinned === 'right' ? 'var(--radius)' : undefined,
		boxShadow:
			isOverflowing.horizontal && isLastLeftPinnedColumn
				? '-4px 0 4px -4px var(--border) inset'
				: isOverflowing.horizontal && isFirstRightPinnedColumn
					? '4px 0 4px -4px var(--border) inset'
					: undefined,
		left:
			isOverflowing.horizontal && isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
		opacity: 1,
		position: isOverflowing.horizontal && isPinned ? 'sticky' : 'relative',
		right:
			isOverflowing.horizontal && isPinned === 'right'
				? `${column.getAfter('right')}px`
				: undefined,
		width: column.getSize(),
		zIndex: isOverflowing.horizontal && isPinned ? 1 : 0
	}
}

function DataTableNoData({
	columnsLength,
	isOverflowing
}: {
	columnsLength: number
	isOverflowing: { horizontal: boolean; vertical: boolean }
}) {
	return (
		<TableRow className="hover:bg-transparent">
			<TableCell
				className={cn('relative', 'text-center')}
				colSpan={columnsLength}
				style={{ height: '490px' }}
			>
				<div
					className={cn(
						'absolute',
						'inset-0',
						'flex',
						'flex-col',
						'items-center',
						'justify-center',
						'gap-2',
						'bg-background'
					)}
					style={{
						left: isOverflowing.horizontal ? '50%' : '50%',
						minWidth: '300px',
						position: isOverflowing.horizontal ? 'sticky' : 'absolute',
						transform: 'translateX(-50%)',
						width: isOverflowing.horizontal ? 'fit-content' : '100%',
						zIndex: isOverflowing.horizontal ? 2 : 1
					}}
				>
					<div className={cn('text-lg', 'font-semibold', 'text-foreground')}>
						No data to display
					</div>
					<div className={cn('text-sm', 'text-muted-foreground')}>
						This table is empty for the time being.
					</div>
				</div>
			</TableCell>
		</TableRow>
	)
}

DataTable.displayName = 'DataTable'
