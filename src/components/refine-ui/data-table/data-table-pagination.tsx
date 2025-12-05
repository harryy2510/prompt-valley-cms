import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { cn } from '@/libs/cn'

type DataTablePaginationProps = {
	currentPage: number
	pageCount: number
	pageSize: number
	setCurrentPage: (page: number) => void
	setPageSize: (size: number) => void
	total?: number
}

export function DataTablePagination({
	currentPage,
	pageCount,
	pageSize,
	setCurrentPage,
	setPageSize,
	total
}: DataTablePaginationProps) {
	const pageSizeOptions = useMemo(() => {
		const baseOptions = [10, 20, 30, 40, 50]
		const optionsSet = new Set(baseOptions)

		if (!optionsSet.has(pageSize)) {
			optionsSet.add(pageSize)
		}

		return Array.from(optionsSet).sort((a, b) => a - b)
	}, [pageSize])

	return (
		<div
			className={cn(
				'flex',
				'items-center',
				'justify-between',
				'flex-wrap',
				'px-2',
				'w-full',
				'gap-2'
			)}
		>
			<div className={cn('flex-1', 'text-sm', 'text-muted-foreground', 'whitespace-nowrap')}>
				{typeof total === 'number' ? `${total} row(s)` : null}
			</div>
			<div className={cn('flex', 'items-center', 'flex-wrap', 'gap-2')}>
				<div className={cn('flex', 'items-center', 'gap-2')}>
					<span className={cn('text-sm', 'font-medium')}>Rows per page</span>
					<Select onValueChange={(v) => setPageSize(Number(v))} value={`${pageSize}`}>
						<SelectTrigger className={cn('h-8', 'w-[70px]')}>
							<SelectValue placeholder={pageSize} />
						</SelectTrigger>
						<SelectContent side="top">
							{pageSizeOptions.map((size) => (
								<SelectItem key={size} value={`${size}`}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className={cn('flex', 'items-center', 'flex-wrap', 'gap-2')}>
					<div className={cn('flex', 'items-center', 'justify-center', 'text-sm', 'font-medium')}>
						Page {currentPage} of {pageCount}
					</div>
					<div className={cn('flex', 'items-center', 'gap-2')}>
						<Button
							aria-label="Go to first page"
							className={cn('hidden', 'h-8', 'w-8', 'p-0', 'lg:flex')}
							disabled={currentPage === 1}
							onClick={() => setCurrentPage(1)}
							variant="outline"
						>
							<ChevronsLeft />
						</Button>
						<Button
							aria-label="Go to previous page"
							className={cn('h-8', 'w-8', 'p-0')}
							disabled={currentPage === 1}
							onClick={() => setCurrentPage(currentPage - 1)}
							variant="outline"
						>
							<ChevronLeft />
						</Button>
						<Button
							aria-label="Go to next page"
							className={cn('h-8', 'w-8', 'p-0')}
							disabled={currentPage === pageCount}
							onClick={() => setCurrentPage(currentPage + 1)}
							variant="outline"
						>
							<ChevronRight />
						</Button>
						<Button
							aria-label="Go to last page"
							className={cn('hidden', 'h-8', 'w-8', 'p-0', 'lg:flex')}
							disabled={currentPage === pageCount}
							onClick={() => setCurrentPage(pageCount)}
							variant="outline"
						>
							<ChevronsRight />
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}

DataTablePagination.displayName = 'DataTablePagination'
