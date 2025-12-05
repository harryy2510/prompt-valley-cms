'use client'

import { CheckIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react'
import { createContext, use, useCallback, useEffect, useRef, useState } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/libs/cn'

type MultiSelectContextType = {
	items: Map<string, ReactNode>
	onItemAdded: (value: string, label: ReactNode) => void
	open: boolean
	selectedValues: Set<string>
	setOpen: (open: boolean) => void
	toggleValue: (value: string) => void
}
const MultiSelectContext = createContext<MultiSelectContextType | null>(null)

export function MultiSelect({
	children,
	defaultValues,
	onValuesChange,
	values
}: {
	children: ReactNode
	defaultValues?: Array<string>
	onValuesChange?: (values: Array<string>) => void
	values?: Array<string>
}) {
	const [open, setOpen] = useState(false)
	const [internalValues, setInternalValues] = useState(new Set<string>(values ?? defaultValues))
	const selectedValues = values ? new Set(values) : internalValues
	const [items, setItems] = useState<Map<string, ReactNode>>(new Map())

	function toggleValue(value: string) {
		const getNewSet = (prev: Set<string>) => {
			const newSet = new Set(prev)
			if (newSet.has(value)) {
				newSet.delete(value)
			} else {
				newSet.add(value)
			}
			return newSet
		}
		setInternalValues(getNewSet)
		onValuesChange?.([...getNewSet(selectedValues)])
	}

	const onItemAdded = useCallback((value: string, label: ReactNode) => {
		setItems((prev) => {
			if (prev.get(value) === label) return prev
			return new Map(prev).set(value, label)
		})
	}, [])

	return (
		<MultiSelectContext
			value={{
				items,
				onItemAdded,
				open,
				selectedValues,
				setOpen,
				toggleValue
			}}
		>
			<Popover modal={true} onOpenChange={setOpen} open={open}>
				{children}
			</Popover>
		</MultiSelectContext>
	)
}

export function MultiSelectContent({
	children,
	search = true,
	...props
}: Omit<ComponentPropsWithoutRef<typeof Command>, 'children'> & {
	children: ReactNode
	search?: boolean | { emptyMessage?: string; placeholder?: string }
}) {
	const canSearch = typeof search === 'object' ? true : search

	return (
		<>
			<div style={{ display: 'none' }}>
				<Command>
					<CommandList>{children}</CommandList>
				</Command>
			</div>
			<PopoverContent className="min-w-[var(--radix-popover-trigger-width)] p-0">
				<Command {...props}>
					{canSearch ? (
						<CommandInput
							placeholder={typeof search === 'object' ? search.placeholder : undefined}
						/>
					) : (
						<button autoFocus className="sr-only" />
					)}
					<CommandList>
						{canSearch && (
							<CommandEmpty>
								{typeof search === 'object' ? search.emptyMessage : undefined}
							</CommandEmpty>
						)}
						{children}
					</CommandList>
				</Command>
			</PopoverContent>
		</>
	)
}

export function MultiSelectGroup(props: ComponentPropsWithoutRef<typeof CommandGroup>) {
	return <CommandGroup {...props} />
}

export function MultiSelectItem({
	badgeLabel,
	children,
	onSelect,
	value,
	...props
}: Omit<ComponentPropsWithoutRef<typeof CommandItem>, 'value'> & {
	badgeLabel?: ReactNode
	value: string
}) {
	const { onItemAdded, selectedValues, toggleValue } = useMultiSelectContext()
	const isSelected = selectedValues.has(value)

	useEffect(() => {
		onItemAdded(value, badgeLabel ?? children)
	}, [value, children, onItemAdded, badgeLabel])

	return (
		<CommandItem
			{...props}
			onSelect={() => {
				toggleValue(value)
				onSelect?.(value)
			}}
		>
			<CheckIcon className={cn('mr-2 size-4', isSelected ? 'opacity-100' : 'opacity-0')} />
			{children}
		</CommandItem>
	)
}

export function MultiSelectSeparator(props: ComponentPropsWithoutRef<typeof CommandSeparator>) {
	return <CommandSeparator {...props} />
}

export function MultiSelectTrigger({
	children,
	className,
	...props
}: ComponentPropsWithoutRef<typeof Button> & {
	children?: ReactNode
	className?: string
}) {
	const { open } = useMultiSelectContext()

	return (
		<PopoverTrigger asChild>
			<Button
				{...props}
				aria-expanded={props['aria-expanded'] ?? open}
				className={cn(
					"flex h-auto min-h-9 w-fit items-center justify-between gap-2 overflow-hidden rounded-md border border-input bg-transparent px-3 py-1.5 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
					className
				)}
				role={props.role ?? 'combobox'}
				variant={props.variant ?? 'outline'}
			>
				{children}
				<ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
			</Button>
		</PopoverTrigger>
	)
}

export function MultiSelectValue({
	className,
	clickToRemove = true,
	overflowBehavior = 'wrap-when-open',
	placeholder,
	...props
}: Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
	clickToRemove?: boolean
	overflowBehavior?: 'cutoff' | 'wrap' | 'wrap-when-open'
	placeholder?: string
}) {
	const { items, open, selectedValues, toggleValue } = useMultiSelectContext()
	const [overflowAmount, setOverflowAmount] = useState(0)
	const valueRef = useRef<HTMLDivElement>(null)
	const overflowRef = useRef<HTMLDivElement>(null)

	const shouldWrap = overflowBehavior === 'wrap' || (overflowBehavior === 'wrap-when-open' && open)

	const checkOverflow = useCallback(() => {
		if (valueRef.current == null) return

		const containerElement = valueRef.current
		const overflowElement = overflowRef.current
		const items = containerElement.querySelectorAll<HTMLElement>('[data-selected-item]')

		if (overflowElement != null) overflowElement.style.display = 'none'
		items.forEach((child) => child.style.removeProperty('display'))
		let amount = 0
		for (let i = items.length - 1; i >= 0; i--) {
			const child = items[i]
			if (containerElement.scrollWidth <= containerElement.clientWidth) {
				break
			}
			amount = items.length - i
			child.style.display = 'none'
			overflowElement?.style.removeProperty('display')
		}
		setOverflowAmount(amount)
	}, [])

	const handleResize = useCallback(
		(node: HTMLDivElement) => {
			valueRef.current = node

			const mutationObserver = new MutationObserver(checkOverflow)
			const observer = new ResizeObserver(debounce(checkOverflow, 100))

			mutationObserver.observe(node, {
				attributeFilter: ['class', 'style'],
				attributes: true,
				childList: true
			})
			observer.observe(node)

			return () => {
				observer.disconnect()
				mutationObserver.disconnect()
				valueRef.current = null
			}
		},
		[checkOverflow]
	)

	if (selectedValues.size === 0 && placeholder) {
		return (
			<span className="min-w-0 overflow-hidden font-normal text-muted-foreground">
				{placeholder}
			</span>
		)
	}

	return (
		<div
			{...props}
			className={cn(
				'flex w-full gap-1.5 overflow-hidden',
				shouldWrap && 'h-full flex-wrap',
				className
			)}
			ref={handleResize}
		>
			{[...selectedValues]
				.filter((value) => items.has(value))
				.map((value) => (
					<Badge
						className="group flex items-center gap-1"
						data-selected-item
						key={value}
						onClick={
							clickToRemove
								? (e) => {
										e.stopPropagation()
										toggleValue(value)
									}
								: undefined
						}
						variant="outline"
					>
						{items.get(value)}
						{clickToRemove && (
							<XIcon className="size-2 text-muted-foreground group-hover:text-destructive" />
						)}
					</Badge>
				))}
			<Badge
				ref={overflowRef}
				style={{
					display: overflowAmount > 0 && !shouldWrap ? 'block' : 'none'
				}}
				variant="outline"
			>
				+{overflowAmount}
			</Badge>
		</div>
	)
}

function debounce<T extends (...args: Array<never>) => void>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: null | ReturnType<typeof setTimeout> = null
	return function (this: unknown, ...args: Parameters<T>) {
		if (timeout) clearTimeout(timeout)
		timeout = setTimeout(() => func.apply(this, args), wait)
	}
}

function useMultiSelectContext() {
	const context = use(MultiSelectContext)
	if (context == null) {
		throw new Error('useMultiSelectContext must be used within a MultiSelectContext')
	}
	return context
}
