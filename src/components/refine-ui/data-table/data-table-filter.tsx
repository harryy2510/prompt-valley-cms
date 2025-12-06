/* eslint-disable react-hooks/immutability */
import { useTranslate } from '@refinedev/core'
import type { CrudOperators } from '@refinedev/core'
import type { Column, Table as ReactTable } from '@tanstack/react-table'
import { Check, ChevronsUpDown, ListFilter, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { DateRange } from 'react-day-picker'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/libs/cn'

export type DataTableFilterComboboxProps<TData> = {
	column: Column<TData>
	defaultOperator?: CrudOperators
	multiple?: boolean
	noResultsText?: string
	operators?: Array<CrudOperators>
	options: Array<{ label: string; value: string }>
	placeholder?: string
	table?: ReactTable<TData>
}

export type DataTableFilterDropdownDateRangePickerProps<TData> = {
	column: Column<TData>
	defaultOperator?: CrudOperators
	formatDateRange?: (dateRange: DateRange | undefined) => Array<string> | undefined
}

export type DataTableFilterDropdownDateSinglePickerProps<TData> = {
	column: Column<TData>
	defaultOperator?: CrudOperators
	formatDate?: (date: Date | undefined) => string | undefined
}

export type DataTableFilterDropdownNumericProps<TData> = {
	column: Column<TData>
	defaultOperator?: CrudOperators
	operators?: Array<CrudOperators>
	placeholder?: string
	table: ReactTable<TData>
}

export type DataTableFilterDropdownProps<TData> = {
	children: (args: {
		isOpen: boolean
		setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
	}) => React.ReactNode
	column: Column<TData>
	contentClassName?: string
	triggerClassName?: string
}

export type DataTableFilterDropdownTextProps<TData> = {
	column: Column<TData>
	defaultOperator?: CrudOperators
	operators?: Array<CrudOperators>
	placeholder?: string
	table: ReactTable<TData>
}

export type DataTableFilterInputProps<TData> = {
	column: Column<TData>
	defaultOperator?: CrudOperators
	operators?: Array<CrudOperators>
	renderInput: (props: {
		onChange: (value: Array<string> | string) => void
		value: Array<string> | string
	}) => React.ReactNode
	table?: ReactTable<TData>
}

type DataTableFilterDropdownActionsProps = {
	className?: string
	isApplyDisabled?: boolean
	isClearDisabled?: boolean
	onApply: () => void
	onClear: () => void
}

export function DataTableFilterCombobox<TData>({
	column,
	defaultOperator = 'eq',
	multiple = false,
	noResultsText,
	operators = ['eq', 'ne', 'in', 'nin'],
	options,
	placeholder,
	table
}: DataTableFilterComboboxProps<TData>) {
	const t = useTranslate()
	const [isOpen, setIsOpen] = useState(false)

	return (
		<DataTableFilterInput
			column={column}
			defaultOperator={defaultOperator}
			operators={operators}
			renderInput={({ onChange, value }) => {
				const currentValues = multiple
					? Array.isArray(value)
						? value
						: value && typeof value === 'string'
							? [value]
							: []
					: value && typeof value === 'string'
						? [value]
						: []

				const handleSelect = (optionValue: string) => {
					if (multiple) {
						const newValues = currentValues.includes(optionValue)
							? currentValues.filter((v) => v !== optionValue)
							: [...currentValues, optionValue]
						onChange(newValues)
					} else {
						onChange(optionValue)
						setIsOpen(false)
					}
				}

				const handleRemove = (optionValue: string) => {
					if (multiple) {
						const newValues = currentValues.filter((v) => v !== optionValue)
						onChange(newValues)
					}
				}

				const getDisplayText = () => {
					if (currentValues.length === 0) {
						return placeholder ?? t('table.filter.combobox.placeholder', 'Select...')
					}

					if (multiple) {
						return `${currentValues.length} selected`
					}

					const selectedOption = options.find((option) => option.value === currentValues[0])
					return selectedOption ? selectedOption.label : currentValues[0]
				}

				const getSelectedLabels = () => {
					return currentValues.map((val) => {
						const option = options.find((opt) => opt.value === val)
						return { label: option ? option.label : val, value: val }
					})
				}

				return (
					<Popover onOpenChange={setIsOpen} open={isOpen}>
						<PopoverTrigger asChild>
							<Button
								aria-expanded={isOpen}
								className={cn(
									'w-full',
									'min-w-48',
									'max-w-80',
									'justify-start',
									'h-auto',
									'min-h-9'
								)}
								role="combobox"
								variant="outline"
							>
								<div className={cn('flex', 'gap-2', 'w-full')}>
									{multiple && currentValues.length > 0 ? (
										<div className={cn('flex', 'flex-wrap', 'gap-1', 'flex-1')}>
											{getSelectedLabels()
												.slice(0, 3)
												.map(({ label, value: val }) => (
													<Badge
														className={cn(
															'inline-flex',
															'items-center',
															'gap-0',
															'h-4',
															'pr-0.5',
															'rounded-sm'
														)}
														key={val}
														variant="outline"
													>
														<span className={cn('text-[10px]', 'leading-4')}>{label}</span>
														<span
															className={cn(
																'inline-flex',
																'items-center',
																'justify-center',
																'p-0',
																'w-4',
																'h-full',
																'text-muted-foreground',
																'hover:text-destructive',
																'rounded-sm',
																'cursor-pointer',
																'transition-colors'
															)}
															onClick={(e) => {
																e.preventDefault()
																e.stopPropagation()
																handleRemove(val)
															}}
														>
															<X className={cn('!h-2', '!w-2')} />
														</span>
													</Badge>
												))}
											{currentValues.length > 3 && (
												<span className={cn('text-xs', 'text-muted-foreground', 'px-1')}>
													+{currentValues.length - 3} more
												</span>
											)}
										</div>
									) : (
										<span
											className={cn(
												'truncate',
												'flex-1',
												'text-start',
												'text-xs',
												currentValues.length === 0 && 'text-muted-foreground'
											)}
										>
											{getDisplayText()}
										</span>
									)}

									<ChevronsUpDown className={cn('h-4', 'w-4', 'shrink-0', 'opacity-50')} />
								</div>
							</Button>
						</PopoverTrigger>
						<PopoverContent align="start" className={cn('w-[200px]', 'p-0')}>
							<Command>
								<CommandInput placeholder={t('table.filter.combobox.search', 'Search...')} />
								<CommandList>
									<CommandEmpty>
										{noResultsText ?? t('table.filter.combobox.noResults', 'Results not found.')}
									</CommandEmpty>
									<CommandGroup>
										{options.map((option) => (
											<CommandItem
												key={option.value}
												keywords={option.label?.split(' ') ?? []}
												onSelect={() => handleSelect(option.value)}
												value={option.value}
											>
												{option.label}
												<Check
													className={cn(
														'ml-auto',
														'h-4',
														'w-4',
														currentValues.includes(option.value) ? 'opacity-100' : 'opacity-0'
													)}
												/>
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				)
			}}
			table={table}
		/>
	)
}

export function DataTableFilterDropdown<TData>({
	children,
	column,
	contentClassName,
	triggerClassName
}: DataTableFilterDropdownProps<TData>) {
	const [isOpen, setIsOpen] = useState(false)

	const isFiltered = column.getIsFiltered()

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger asChild>
				<Button
					className={cn(
						'data-[state=open]:bg-accent',
						'w-5 h-5',
						{
							'text-muted-foreground': !isFiltered,
							'text-primary': isFiltered
						},
						triggerClassName
					)}
					onClick={() => setIsOpen(true)}
					size="icon"
					variant="ghost"
				>
					<ListFilter className={cn('!h-3', '!w-3')} />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className={cn('w-full', 'shadow-sm', contentClassName)}>
				{children({ isOpen, setIsOpen })}
			</PopoverContent>
		</Popover>
	)
}

export function DataTableFilterDropdownActions({
	className,
	isApplyDisabled,
	isClearDisabled,
	onApply,
	onClear
}: DataTableFilterDropdownActionsProps) {
	const t = useTranslate()

	return (
		<div className={cn('flex', 'items-center', 'justify-between', 'w-full', 'gap-2', className)}>
			<Button
				className={cn('rounded-sm', 'text-xs', 'font-semibold', 'text-muted-foreground')}
				disabled={isClearDisabled}
				onClick={() => {
					onClear()
				}}
				size="sm"
				variant="ghost"
			>
				<X className={cn('w-3.5', 'h-3.5', 'text-muted-foreground')} />
				{t('buttons.clear', 'Clear')}
			</Button>

			<Button
				className={cn('rounded-sm', 'text-xs', 'font-semibold')}
				disabled={isApplyDisabled}
				onClick={() => {
					onApply()
				}}
				size="sm"
			>
				{t('buttons.apply', 'Apply')}
			</Button>
		</div>
	)
}

export function DataTableFilterDropdownDateRangePicker<TData>({
	column,
	defaultOperator = 'between',
	formatDateRange
}: DataTableFilterDropdownDateRangePickerProps<TData>) {
	const columnFilterValue = column.getFilterValue() as Array<string>

	const parseDateRange = (value: Array<string> | undefined): DateRange | undefined => {
		if (!value || !Array.isArray(value) || value.length !== 2) return undefined

		const from = value[0] ? new Date(value[0]) : undefined
		const to = value[1] ? new Date(value[1]) : undefined

		if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return undefined
		return { from, to }
	}

	const [filterValue, setFilterValue] = useState<DateRange | undefined>(() =>
		parseDateRange(columnFilterValue)
	)

	useEffect(() => {
		column.columnDef.meta = {
			...column.columnDef.meta,
			filterOperator: defaultOperator
		}
	}, [defaultOperator, column])

	useEffect(() => {
		setFilterValue(parseDateRange(columnFilterValue))
		// eslint-disable-next-line react-hooks/exhaustive-deps -- objects are always different
	}, [JSON.stringify(columnFilterValue)])

	const hasDateRange = filterValue?.from && filterValue?.to

	const handleApply = () => {
		if (!filterValue?.from || !filterValue?.to) return

		const values = formatDateRange?.(filterValue) ?? [
			filterValue.from.toISOString(),
			filterValue.to.toISOString()
		]
		column.setFilterValue(values)
	}

	return (
		<DataTableFilterDropdown column={column} contentClassName={cn('w-fit', 'p-0')}>
			{({ setIsOpen }) => {
				return (
					<div
						className={cn('flex', 'flex-col', 'items-center')}
						onKeyDown={(event) => {
							if (!hasDateRange) return
							if (event.key === 'Enter') {
								handleApply()
								setIsOpen(false)
							}
						}}
					>
						<Calendar
							mode="range"
							numberOfMonths={2}
							onSelect={(date) => {
								setFilterValue({
									from: date?.from,
									to: date?.to
								})
							}}
							selected={filterValue}
						/>

						<div className={cn('w-full')}>
							<Separator />
						</div>

						<DataTableFilterDropdownActions
							className={cn('p-4')}
							isApplyDisabled={!hasDateRange}
							onApply={() => {
								handleApply()
								setIsOpen(false)
							}}
							onClear={() => {
								column.setFilterValue(undefined)
								setFilterValue(undefined)
								setIsOpen(false)
							}}
						/>
					</div>
				)
			}}
		</DataTableFilterDropdown>
	)
}

export function DataTableFilterDropdownDateSinglePicker<TData>({
	column,
	defaultOperator = 'eq',
	formatDate
}: DataTableFilterDropdownDateSinglePickerProps<TData>) {
	const columnFilterValue = column.getFilterValue() as string

	const parseDate = (value: string | undefined): Date | undefined => {
		if (!value) return undefined

		const date = new Date(value)

		if (Number.isNaN(date.getTime())) return undefined
		return date
	}

	const [filterValue, setFilterValue] = useState<Date | undefined>(() =>
		parseDate(columnFilterValue)
	)

	useEffect(() => {
		column.columnDef.meta = {
			...column.columnDef.meta,
			filterOperator: defaultOperator
		}
	}, [defaultOperator, column])

	useEffect(() => {
		setFilterValue(parseDate(columnFilterValue))
	}, [columnFilterValue])

	const hasDate = !!filterValue

	const handleApply = () => {
		if (!filterValue) return

		const value = formatDate?.(filterValue) ?? filterValue.toISOString()
		column.setFilterValue(value)
	}

	return (
		<DataTableFilterDropdown column={column} contentClassName={cn('w-fit', 'p-0')}>
			{({ setIsOpen }) => {
				return (
					<div
						className={cn('flex', 'flex-col', 'items-center')}
						onKeyDown={(event) => {
							if (!hasDate) return
							if (event.key === 'Enter') {
								handleApply()
								setIsOpen(false)
							}
						}}
					>
						<Calendar
							mode="single"
							onSelect={(date) => {
								setFilterValue(date)
							}}
							selected={filterValue}
						/>

						<div className={cn('w-full')}>
							<Separator />
						</div>

						<DataTableFilterDropdownActions
							className={cn('p-4')}
							isApplyDisabled={!hasDate}
							onApply={() => {
								handleApply()
								setIsOpen(false)
							}}
							onClear={() => {
								column.setFilterValue(undefined)
								setFilterValue(undefined)
								setIsOpen(false)
							}}
						/>
					</div>
				)
			}}
		</DataTableFilterDropdown>
	)
}

export function DataTableFilterDropdownNumeric<TData>({
	column,
	defaultOperator = 'eq',
	operators = ['eq', 'ne', 'gt', 'lt', 'gte', 'lte'],
	placeholder,
	table
}: DataTableFilterDropdownNumericProps<TData>) {
	const t = useTranslate()

	return (
		<DataTableFilterInput
			column={column}
			defaultOperator={defaultOperator}
			operators={operators}
			renderInput={({ onChange, value }) => (
				<Input
					onChange={(event) => {
						onChange(event.target.value)
					}}
					placeholder={placeholder ?? t('table.filter.numeric.placeholder', 'Filter by...')}
					type="number"
					value={value}
				/>
			)}
			table={table}
		/>
	)
}

export function DataTableFilterDropdownText<TData>({
	column,
	defaultOperator = 'eq',
	operators = [
		'eq',
		'ne',
		'contains',
		'ncontains',
		'containss',
		'ncontainss',
		'startswith',
		'nstartswith',
		'startswiths',
		'nstartswiths',
		'endswith',
		'nendswith',
		'endswiths',
		'nendswiths',
		'in',
		'nin',
		'ina',
		'nina'
	],
	placeholder,
	table
}: DataTableFilterDropdownTextProps<TData>) {
	const t = useTranslate()

	return (
		<DataTableFilterInput
			column={column}
			defaultOperator={defaultOperator}
			operators={operators}
			renderInput={({ onChange, value }) => (
				<Input
					onChange={(event) => {
						onChange(event.target.value)
					}}
					placeholder={placeholder ?? t('table.filter.text.placeholder', 'Filter by...')}
					type="text"
					value={value}
				/>
			)}
			table={table}
		/>
	)
}

export function DataTableFilterInput<TData>({
	column: columnFromProps,
	defaultOperator: defaultOperatorFromProps,
	operators: operatorsFromProps,
	renderInput,
	table: tableFromProps
}: DataTableFilterInputProps<TData>) {
	const columnFilterValue = columnFromProps.getFilterValue() as Array<string> | string | undefined

	// Local state for the input value - allows buffering changes until Apply
	const [filterValue, setFilterValue] = useState<Array<string> | string>(columnFilterValue || '')

	const [operator, setOperator] = useState<CrudOperators>(() => {
		if (!tableFromProps) {
			return defaultOperatorFromProps || 'eq'
		}

		const columnFilter = tableFromProps.getState().columnFilters.find((filter) => {
			return filter.id === columnFromProps.id
		})

		if (columnFilter && 'operator' in columnFilter) {
			return columnFilter.operator as CrudOperators
		}

		return defaultOperatorFromProps || 'eq'
	})

	// Sync local state when column filter changes externally (e.g., clear button)
	useEffect(() => {
		setFilterValue(columnFilterValue || '')
		// eslint-disable-next-line react-hooks/exhaustive-deps -- only sync when external value changes
	}, [columnFilterValue])

	const handleApply = () => {
		columnFromProps.setFilterValue(filterValue || undefined)
	}

	const handleClear = () => {
		setFilterValue('')
		columnFromProps.setFilterValue(undefined)
	}

	const handleOperatorChange = (value: CrudOperators) => {
		setOperator(value)
		columnFromProps.columnDef.meta = {
			...columnFromProps.columnDef.meta,
			filterOperator: value
		}
	}

	return (
		<DataTableFilterDropdown column={columnFromProps}>
			{({ setIsOpen }) => {
				return (
					<div
						className={cn('flex', 'flex-col', 'items-center', 'gap-4', 'w-full')}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								handleApply()
								setIsOpen(false)
							}
						}}
					>
						<div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-2')}>
							{operatorsFromProps && operatorsFromProps.length > 1 && (
								<DataTableFilterOperatorSelect
									onValueChange={handleOperatorChange}
									operators={operatorsFromProps}
									value={operator}
								/>
							)}
							{renderInput({
								onChange: setFilterValue,
								value: filterValue
							})}
						</div>
						<div className={cn('w-full')}>
							<Separator />
						</div>
						<DataTableFilterDropdownActions
							onApply={() => {
								handleApply()
								setIsOpen(false)
							}}
							onClear={() => {
								handleClear()
								setIsOpen(false)
							}}
						/>
					</div>
				)
			}}
		</DataTableFilterDropdown>
	)
}

const CRUD_OPERATOR_LABELS: Record<
	Exclude<CrudOperators, 'and' | 'or'>,
	{ defaultLabel: string; i18nKey: string }
> = {
	between: {
		defaultLabel: 'Between',
		i18nKey: 'table.filter.operator.between'
	},
	contains: {
		defaultLabel: 'Contains',
		i18nKey: 'table.filter.operator.contains'
	},
	containss: {
		defaultLabel: 'Contains (case sensitive)',
		i18nKey: 'table.filter.operator.containss'
	},
	endswith: {
		defaultLabel: 'Ends with',
		i18nKey: 'table.filter.operator.endswith'
	},
	endswiths: {
		defaultLabel: 'Ends with (case sensitive)',
		i18nKey: 'table.filter.operator.endswiths'
	},
	eq: { defaultLabel: 'Equals', i18nKey: 'table.filter.operator.eq' },
	gt: { defaultLabel: 'Greater than', i18nKey: 'table.filter.operator.gt' },
	gte: {
		defaultLabel: 'Greater than or equal',
		i18nKey: 'table.filter.operator.gte'
	},
	in: {
		defaultLabel: 'Includes in an array',
		i18nKey: 'table.filter.operator.in'
	},
	ina: {
		defaultLabel: 'Includes in an array (case sensitive)',
		i18nKey: 'table.filter.operator.ina'
	},
	lt: { defaultLabel: 'Less than', i18nKey: 'table.filter.operator.lt' },
	lte: {
		defaultLabel: 'Less than or equal',
		i18nKey: 'table.filter.operator.lte'
	},
	nbetween: {
		defaultLabel: 'Not between',
		i18nKey: 'table.filter.operator.nbetween'
	},
	ncontains: {
		defaultLabel: 'Not contains',
		i18nKey: 'table.filter.operator.ncontains'
	},
	ncontainss: {
		defaultLabel: 'Not contains (case sensitive)',
		i18nKey: 'table.filter.operator.ncontainss'
	},
	ne: { defaultLabel: 'Not equals', i18nKey: 'table.filter.operator.ne' },
	nendswith: {
		defaultLabel: 'Not ends with',
		i18nKey: 'table.filter.operator.nendswith'
	},
	nendswiths: {
		defaultLabel: 'Not ends with (case sensitive)',
		i18nKey: 'table.filter.operator.nendswiths'
	},
	nin: {
		defaultLabel: 'Not includes in an array',
		i18nKey: 'table.filter.operator.nin'
	},
	nina: {
		defaultLabel: 'Not includes in an array (case sensitive)',
		i18nKey: 'table.filter.operator.nina'
	},
	nnull: {
		defaultLabel: 'Is not null',
		i18nKey: 'table.filter.operator.nnull'
	},
	nstartswith: {
		defaultLabel: 'Not starts with',
		i18nKey: 'table.filter.operator.nstartswith'
	},
	nstartswiths: {
		defaultLabel: 'Not starts with (case sensitive)',
		i18nKey: 'table.filter.operator.nstartswiths'
	},
	null: { defaultLabel: 'Is null', i18nKey: 'table.filter.operator.null' },
	startswith: {
		defaultLabel: 'Starts with',
		i18nKey: 'table.filter.operator.startswith'
	},
	startswiths: {
		defaultLabel: 'Starts with (case sensitive)',
		i18nKey: 'table.filter.operator.startswiths'
	}
}

export type DataTableFilterClearButtonProps<TData> = {
	column: Column<TData>
}

export type DataTableFilterOperatorSelectProps = {
	contentClassName?: string
	onValueChange: (value: CrudOperators) => void
	operators?: Array<CrudOperators>
	placeholder?: string
	triggerClassName?: string
	value: CrudOperators
}

export function DataTableFilterClearButton<TData>({
	column
}: DataTableFilterClearButtonProps<TData>) {
	const isFiltered = column.getIsFiltered()

	if (!isFiltered) return null

	return (
		<Button
			className={cn('w-5', 'h-5', 'text-muted-foreground', 'hover:text-destructive')}
			onClick={() => column.setFilterValue(undefined)}
			size="icon"
			variant="ghost"
		>
			<X className={cn('!h-3', '!w-3')} />
		</Button>
	)
}

export function DataTableFilterOperatorSelect({
	contentClassName,
	onValueChange,
	operators: operatorsFromProps,
	placeholder,
	triggerClassName,
	value
}: DataTableFilterOperatorSelectProps) {
	const t = useTranslate()

	const [open, setOpen] = useState(false)

	const operators = useMemo(() => {
		return Object.entries(CRUD_OPERATOR_LABELS).filter(([operator]) =>
			operatorsFromProps?.includes(operator as CrudOperators)
		)
	}, [operatorsFromProps])

	const selectedLabel = t(
		CRUD_OPERATOR_LABELS[value as Exclude<CrudOperators, 'and' | 'or'>].i18nKey,
		CRUD_OPERATOR_LABELS[value as Exclude<CrudOperators, 'and' | 'or'>].defaultLabel
	)
	const placeholderText =
		placeholder ?? t('table.filter.operator.placeholder', 'Search operator...')
	const noResultsText = t('table.filter.operator.noResults', 'No operator found.')

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					aria-expanded={open}
					className={cn('w-full', 'justify-between', 'truncate', triggerClassName)}
					role="combobox"
					variant="outline"
				>
					<div className={cn('truncate')}>{selectedLabel ?? placeholderText}</div>
					<ChevronsUpDown className={cn('ml-2', 'h-4', 'w-4', 'shrink-0', 'opacity-50')} />
				</Button>
			</PopoverTrigger>
			<PopoverContent className={cn('p-0', contentClassName)} forceMount>
				<Command>
					<CommandInput placeholder={placeholderText} />
					<CommandList>
						<CommandEmpty>{noResultsText}</CommandEmpty>
						<CommandGroup>
							{operators.map(([op, { defaultLabel, i18nKey }]) => (
								<CommandItem
									key={op}
									onSelect={() => {
										onValueChange(op as CrudOperators)
										setOpen(false)
									}}
									value={op}
								>
									<Check
										className={cn('mr-2', 'h-4', 'w-4', value === op ? 'opacity-100' : 'opacity-0')}
									/>
									{t(i18nKey, defaultLabel)}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}

DataTableFilterClearButton.displayName = 'DataTableFilterClearButton'
DataTableFilterDropdown.displayName = 'DataTableFilterDropdown'
DataTableFilterDropdownText.displayName = 'DataTableFilterDropdownText'
DataTableFilterCombobox.displayName = 'DataTableFilterCombobox'
DataTableFilterDropdownDateRangePicker.displayName = 'DataTableFilterDropdownDateRangePicker'
DataTableFilterOperatorSelect.displayName = 'DataTableFilterOperatorSelect'
DataTableFilterDropdownActions.displayName = 'DataTableFilterDropdownActions'
DataTableFilterDropdownNumeric.displayName = 'DataTableFilterDropdownNumeric'
DataTableFilterInput.displayName = 'DataTableFilterInput'
DataTableFilterOperatorSelect.displayName = 'DataTableFilterOperatorSelect'
DataTableFilterDropdownDateSinglePicker.displayName = 'DataTableFilterDropdownDateSinglePicker'
