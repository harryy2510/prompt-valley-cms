import type { HttpError, BaseRecord } from '@refinedev/core'
import type { UseTableReturnType } from '@refinedev/react-table'
import type { Column, Row } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import { Loader2, Eye, Pencil, Trash2, Copy, ExternalLink } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigation, useNotification } from '@refinedev/core'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { DataTablePagination } from '@/components/refine-ui/data-table/data-table-pagination'
import { cn } from '@/libs/cn'

type ContextMenuAction<TData> = {
  label: string
  icon?: ReactNode
  onClick: (row: TData) => void
  variant?: 'default' | 'destructive'
  hidden?: (row: TData) => boolean
}

type DataTableProps<TData extends BaseRecord> = {
  table: UseTableReturnType<TData, HttpError>
  /** Resource name for default context menu actions (view, edit, delete) */
  resource?: string
  /** Custom context menu actions */
  contextMenuActions?: ContextMenuAction<TData>[]
  /** Disable default context menu */
  disableContextMenu?: boolean
  /** Custom delete handler */
  onDelete?: (row: TData) => Promise<void>
}

export function DataTable<TData extends BaseRecord>({
  table,
  resource,
  contextMenuActions = [],
  disableContextMenu = false,
  onDelete,
}: DataTableProps<TData>) {
  const {
    reactTable: { getHeaderGroups, getRowModel, getAllColumns },
    refineCore: {
      tableQuery,
      currentPage,
      setCurrentPage,
      pageCount,
      pageSize,
      setPageSize,
    },
  } = table

  const { edit, show } = useNavigation()
  const { open: notify } = useNotification()

  const columns = getAllColumns()
  const leafColumns = table.reactTable.getAllLeafColumns()
  const isLoading = tableQuery.isLoading

  const tableContainerRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const [isOverflowing, setIsOverflowing] = useState({
    horizontal: false,
    vertical: false,
  })

  const handleCopyId = (id: string | number) => {
    navigator.clipboard.writeText(String(id))
    notify?.({
      type: 'success',
      message: 'ID copied to clipboard',
    })
  }

  useEffect(() => {
    const checkOverflow = () => {
      if (tableRef.current && tableContainerRef.current) {
        const table = tableRef.current
        const container = tableContainerRef.current

        const horizontalOverflow = table.offsetWidth > container.clientWidth
        const verticalOverflow = table.offsetHeight > container.clientHeight

        setIsOverflowing({
          horizontal: horizontalOverflow,
          vertical: verticalOverflow,
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
      <div ref={tableContainerRef} className={cn('rounded-md', 'border')}>
        <Table ref={tableRef} style={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHeader>
            {getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isPlaceholder = header.isPlaceholder

                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        ...getCommonStyles({
                          column: header.column,
                          isOverflowing: isOverflowing,
                        }),
                      }}
                    >
                      {isPlaceholder ? null : (
                        <div className={cn('flex', 'items-center', 'gap-1')}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
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
                {Array.from({ length: pageSize < 1 ? 1 : pageSize }).map(
                  (_, rowIndex) => (
                    <TableRow
                      key={`skeleton-row-${rowIndex}`}
                      aria-hidden="true"
                    >
                      {leafColumns.map((column) => (
                        <TableCell
                          key={`skeleton-cell-${rowIndex}-${column.id}`}
                          style={{
                            ...getCommonStyles({
                              column,
                              isOverflowing: isOverflowing,
                            }),
                          }}
                          className={cn('truncate')}
                        >
                          <div className="h-8" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ),
                )}
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className={cn('absolute', 'inset-0', 'pointer-events-none')}
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
                        '-translate-y-1/2',
                      )}
                    />
                  </TableCell>
                </TableRow>
              </>
            ) : getRowModel().rows?.length ? (
              getRowModel().rows.map((row) => {
                const rowContent = (
                  <TableRow
                    key={row.original?.id ?? row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={!disableContextMenu ? 'cursor-context-menu' : ''}
                  >
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <TableCell
                          key={cell.id}
                          style={{
                            ...getCommonStyles({
                              column: cell.column,
                              isOverflowing: isOverflowing,
                            }),
                          }}
                        >
                          <div className="truncate">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
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
                          variant="destructive"
                          onClick={() => onDelete(row.original)}
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
                isOverflowing={isOverflowing}
                columnsLength={columns.length}
              />
            )}
          </TableBody>
        </Table>
      </div>
      {!isLoading && getRowModel().rows?.length > 0 && (
        <DataTablePagination
          currentPage={currentPage}
          pageCount={pageCount}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          total={tableQuery.data?.total}
        />
      )}
    </div>
  )
}

function DataTableNoData({
  isOverflowing,
  columnsLength,
}: {
  isOverflowing: { horizontal: boolean; vertical: boolean }
  columnsLength: number
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell
        colSpan={columnsLength}
        className={cn('relative', 'text-center')}
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
            'bg-background',
          )}
          style={{
            position: isOverflowing.horizontal ? 'sticky' : 'absolute',
            left: isOverflowing.horizontal ? '50%' : '50%',
            transform: 'translateX(-50%)',
            zIndex: isOverflowing.horizontal ? 2 : 1,
            width: isOverflowing.horizontal ? 'fit-content' : '100%',
            minWidth: '300px',
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

export function getCommonStyles<TData>({
  column,
  isOverflowing,
}: {
  column: Column<TData>
  isOverflowing: {
    horizontal: boolean
    vertical: boolean
  }
}): React.CSSProperties {
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn =
    isPinned === 'left' && column.getIsLastColumn('left')
  const isFirstRightPinnedColumn =
    isPinned === 'right' && column.getIsFirstColumn('right')

  return {
    boxShadow:
      isOverflowing.horizontal && isLastLeftPinnedColumn
        ? '-4px 0 4px -4px var(--border) inset'
        : isOverflowing.horizontal && isFirstRightPinnedColumn
          ? '4px 0 4px -4px var(--border) inset'
          : undefined,
    left:
      isOverflowing.horizontal && isPinned === 'left'
        ? `${column.getStart('left')}px`
        : undefined,
    right:
      isOverflowing.horizontal && isPinned === 'right'
        ? `${column.getAfter('right')}px`
        : undefined,
    opacity: 1,
    position: isOverflowing.horizontal && isPinned ? 'sticky' : 'relative',
    background: isOverflowing.horizontal && isPinned ? 'var(--background)' : '',
    borderTopRightRadius:
      isOverflowing.horizontal && isPinned === 'right'
        ? 'var(--radius)'
        : undefined,
    borderBottomRightRadius:
      isOverflowing.horizontal && isPinned === 'right'
        ? 'var(--radius)'
        : undefined,
    borderTopLeftRadius:
      isOverflowing.horizontal && isPinned === 'left'
        ? 'var(--radius)'
        : undefined,
    borderBottomLeftRadius:
      isOverflowing.horizontal && isPinned === 'left'
        ? 'var(--radius)'
        : undefined,
    width: column.getSize(),
    zIndex: isOverflowing.horizontal && isPinned ? 1 : 0,
  }
}

DataTable.displayName = 'DataTable'
