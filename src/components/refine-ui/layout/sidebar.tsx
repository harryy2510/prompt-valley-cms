import { useLink, useMenu, useParsed, useRefineOptions } from '@refinedev/core'
import type { TreeMenuItem } from '@refinedev/core'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, FolderOpen, ListIcon } from 'lucide-react'
import React from 'react'

import { listBucketsServer } from '@/actions/storage'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
	Sidebar as ShadcnSidebar,
	SidebarContent as ShadcnSidebarContent,
	SidebarHeader as ShadcnSidebarHeader,
	SidebarRail as ShadcnSidebarRail,
	SidebarTrigger as ShadcnSidebarTrigger,
	useSidebar as useShadcnSidebar
} from '@/components/ui/sidebar'
import { cn } from '@/libs/cn'

type IconProps = {
	icon: React.ReactNode
	isSelected?: boolean
}

type MenuItemProps = {
	item: TreeMenuItem
	selectedKey?: string
}

type SidebarButtonProps = React.ComponentProps<typeof Button> & {
	asLink?: boolean
	isSelected?: boolean
	item: TreeMenuItem
	onClick?: () => void
	rightIcon?: React.ReactNode
}

export function Sidebar() {
	const { open } = useShadcnSidebar()
	const { menuItems, selectedKey } = useMenu()

	return (
		<ShadcnSidebar className={cn('border-none')} collapsible="icon">
			<ShadcnSidebarRail />
			<SidebarHeader />
			<ShadcnSidebarContent
				className={cn(
					'transition-discrete',
					'duration-200',
					'flex',
					'flex-col',
					'gap-2',
					'pt-2',
					'pb-2',
					'border-r',
					'border-border',
					{
						'px-1': !open,
						'px-3': open
					}
				)}
			>
				{menuItems.map((item: TreeMenuItem) => (
					<SidebarItem item={item} key={item.key || item.name} selectedKey={selectedKey} />
				))}
			</ShadcnSidebarContent>
		</ShadcnSidebar>
	)
}

function getDisplayName(item: TreeMenuItem) {
	return item.meta?.label ?? item.label ?? item.name
}

function ItemIcon({ icon, isSelected }: IconProps) {
	return (
		<div
			className={cn('w-4', {
				'text-muted-foreground': !isSelected,
				'text-sidebar-primary-foreground': isSelected
			})}
		>
			{icon ?? <ListIcon />}
		</div>
	)
}

function MediaLibrarySidebarItem({ item }: MenuItemProps) {
	const { pathname } = useParsed()
	const Link = useLink()

	const { data: buckets = [], isLoading } = useQuery({
		queryFn: async () => {
			const { data } = await listBucketsServer()
			return data
		},
		queryKey: ['storage-buckets'],
		staleTime: 5 * 60 * 1000 // 5 minutes
	})

	const isParentSelected = pathname === '/media-library'
	const isAnyBucketSelected = pathname?.startsWith('/media-library/') ?? false

	const chevronIcon = (
		<ChevronRight
			className={cn(
				'h-4',
				'w-4',
				'shrink-0',
				'text-muted-foreground',
				'transition-transform',
				'duration-200',
				'group-data-[state=open]:rotate-90'
			)}
		/>
	)

	return (
		<Collapsible
			className={cn('w-full', 'group')}
			defaultOpen={isParentSelected || isAnyBucketSelected}
		>
			<div className="flex items-center">
				<Button
					asChild
					className={cn('flex flex-1 items-center justify-start gap-2 py-2 !px-3 text-sm', {
						'bg-sidebar-primary': isParentSelected,
						'hover:!bg-sidebar-primary/90': isParentSelected,
						'hover:text-sidebar-primary-foreground': isParentSelected,
						'text-sidebar-primary-foreground': isParentSelected
					})}
					size="lg"
					variant="ghost"
				>
					<Link className="flex w-full items-center gap-2" to="/media-library">
						<ItemIcon icon={item.meta?.icon ?? item.icon} isSelected={isParentSelected} />
						<span
							className={cn('flex-1 text-left tracking-[-0.00875rem]', {
								'font-normal': !isParentSelected,
								'font-semibold': isParentSelected,
								'text-foreground': !isParentSelected,
								'text-sidebar-primary-foreground': isParentSelected
							})}
						>
							{getDisplayName(item)}
						</span>
					</Link>
				</Button>
				<CollapsibleTrigger asChild>
					<Button className="h-9 w-9 shrink-0" size="icon" variant="ghost">
						{chevronIcon}
					</Button>
				</CollapsibleTrigger>
			</div>
			<CollapsibleContent className={cn('ml-6', 'flex', 'flex-col', 'gap-1')}>
				{isLoading ? (
					<span className="text-xs text-muted-foreground px-3 py-2">Loading...</span>
				) : buckets.length === 0 ? (
					<span className="text-xs text-muted-foreground px-3 py-2">No buckets</span>
				) : (
					buckets.map((bucket) => {
						const bucketPath = `/media-library/${bucket.id}`
						const isBucketSelected = pathname?.startsWith(bucketPath) ?? false

						return (
							<Button
								asChild
								className={cn('flex w-full items-center justify-start gap-2 py-2 !px-3 text-sm', {
									'bg-sidebar-primary': isBucketSelected,
									'hover:!bg-sidebar-primary/90': isBucketSelected,
									'hover:text-sidebar-primary-foreground': isBucketSelected,
									'text-sidebar-primary-foreground': isBucketSelected
								})}
								key={bucket.id}
								size="lg"
								variant="ghost"
							>
								<Link className="flex w-full items-center gap-2" to={bucketPath}>
									<ItemIcon
										icon={<FolderOpen className="size-4" />}
										isSelected={isBucketSelected}
									/>
									<span
										className={cn('truncate tracking-[-0.00875rem]', {
											'font-normal': !isBucketSelected,
											'font-semibold': isBucketSelected,
											'text-foreground': !isBucketSelected,
											'text-sidebar-primary-foreground': isBucketSelected
										})}
									>
										{bucket.name}
									</span>
								</Link>
							</Button>
						)
					})
				)}
			</CollapsibleContent>
		</Collapsible>
	)
}

function MediaLibrarySidebarItemDropdown({ item }: MenuItemProps) {
	const { pathname } = useParsed()
	const Link = useLink()

	const { data: buckets = [] } = useQuery({
		queryFn: async () => {
			const { data } = await listBucketsServer()
			return data
		},
		queryKey: ['storage-buckets'],
		staleTime: 5 * 60 * 1000 // 5 minutes
	})

	const isParentSelected = pathname === '/media-library'

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					className={cn('flex w-full items-center justify-start gap-2 py-2 !px-3 text-sm', {
						'bg-sidebar-primary': isParentSelected,
						'hover:!bg-sidebar-primary/90': isParentSelected,
						'hover:text-sidebar-primary-foreground': isParentSelected,
						'text-sidebar-primary-foreground': isParentSelected
					})}
					size="lg"
					variant="ghost"
				>
					<ItemIcon icon={item.meta?.icon ?? item.icon} isSelected={isParentSelected} />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" side="right">
				<DropdownMenuItem asChild>
					<Link
						className={cn('flex w-full items-center gap-2', {
							'bg-accent text-accent-foreground': isParentSelected
						})}
						to="/media-library"
					>
						<ItemIcon icon={item.meta?.icon ?? item.icon} isSelected={isParentSelected} />
						<span>{getDisplayName(item)}</span>
					</Link>
				</DropdownMenuItem>
				{buckets.length > 0 && (
					<>
						<div className="h-px bg-border my-1" />
						{buckets.map((bucket) => {
							const bucketPath = `/media-library/${bucket.id}`
							const isBucketSelected = pathname?.startsWith(bucketPath) ?? false

							return (
								<DropdownMenuItem asChild key={bucket.id}>
									<Link
										className={cn('flex w-full items-center gap-2', {
											'bg-accent text-accent-foreground': isBucketSelected
										})}
										to={bucketPath}
									>
										<ItemIcon
											icon={<FolderOpen className="size-4" />}
											isSelected={isBucketSelected}
										/>
										<span>{bucket.name}</span>
									</Link>
								</DropdownMenuItem>
							)
						})}
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

function SidebarButton({
	asLink = false,
	className,
	isSelected = false,
	item,
	onClick,
	rightIcon,
	...props
}: SidebarButtonProps) {
	const Link = useLink()

	const buttonContent = (
		<>
			<ItemIcon icon={item.meta?.icon ?? item.icon} isSelected={isSelected} />
			<span
				className={cn('tracking-[-0.00875rem]', {
					'flex-1': rightIcon,
					'font-normal': !isSelected,
					'font-semibold': isSelected,
					'line-clamp-1': !rightIcon,
					'text-foreground': !isSelected,
					'text-left': rightIcon,
					'text-sidebar-primary-foreground': isSelected,
					truncate: !rightIcon
				})}
			>
				{getDisplayName(item)}
			</span>
			{rightIcon}
		</>
	)

	return (
		<Button
			asChild={!!(asLink && item.route)}
			className={cn(
				'flex w-full items-center justify-start gap-2 py-2 !px-3 text-sm',
				{
					'bg-sidebar-primary': isSelected,
					'hover:!bg-sidebar-primary/90': isSelected,
					'hover:text-sidebar-primary-foreground': isSelected,
					'text-sidebar-primary-foreground': isSelected
				},
				className
			)}
			onClick={onClick}
			size="lg"
			variant="ghost"
			{...props}
		>
			{asLink && item.route ? (
				<Link className={cn('flex w-full items-center gap-2')} to={item.route}>
					{buttonContent}
				</Link>
			) : (
				buttonContent
			)}
		</Button>
	)
}

function SidebarHeader() {
	const { title } = useRefineOptions()
	const { isMobile, open } = useShadcnSidebar()

	return (
		<ShadcnSidebarHeader
			className={cn(
				'p-0',
				'h-16',
				'border-b',
				'border-border',
				'flex-row',
				'items-center',
				'justify-between',
				'overflow-hidden'
			)}
		>
			<div
				className={cn(
					'whitespace-nowrap',
					'flex',
					'flex-row',
					'h-full',
					'items-center',
					'justify-start',
					'gap-2',
					'transition-discrete',
					'duration-200',
					{
						'pl-3': !open,
						'pl-5': open
					}
				)}
			>
				<div>{title.icon}</div>
				<h2
					className={cn('text-sm', 'font-bold', 'transition-opacity', 'duration-200', {
						'opacity-0': !open,
						'opacity-100': open
					})}
				>
					{title.text}
				</h2>
			</div>

			<ShadcnSidebarTrigger
				className={cn('text-muted-foreground', 'mr-1.5', {
					'opacity-0': !open,
					'opacity-100': open || isMobile,
					'pointer-events-auto': open || isMobile,
					'pointer-events-none': !open && !isMobile
				})}
			/>
		</ShadcnSidebarHeader>
	)
}

function SidebarItem({ item, selectedKey }: MenuItemProps) {
	const { open } = useShadcnSidebar()

	if (item.meta?.group) {
		return <SidebarItemGroup item={item} selectedKey={selectedKey} />
	}

	// Special handling for media-library to show buckets as children
	if (item.name === 'media-library') {
		if (open) {
			return <MediaLibrarySidebarItem item={item} selectedKey={selectedKey} />
		}
		return <MediaLibrarySidebarItemDropdown item={item} selectedKey={selectedKey} />
	}

	if (item.children && item.children.length > 0) {
		if (open) {
			return <SidebarItemCollapsible item={item} selectedKey={selectedKey} />
		}
		return <SidebarItemDropdown item={item} selectedKey={selectedKey} />
	}

	return <SidebarItemLink item={item} selectedKey={selectedKey} />
}

function SidebarItemCollapsible({ item, selectedKey }: MenuItemProps) {
	const { children, name } = item

	// Check if any child is selected to determine if we should default to open
	const hasSelectedChild = children?.some((child: TreeMenuItem) => child.key === selectedKey)

	const chevronIcon = (
		<ChevronRight
			className={cn(
				'h-4',
				'w-4',
				'shrink-0',
				'text-muted-foreground',
				'transition-transform',
				'duration-200',
				'group-data-[state=open]:rotate-90'
			)}
		/>
	)

	return (
		<Collapsible
			className={cn('w-full', 'group')}
			defaultOpen={hasSelectedChild || true}
			key={`collapsible-${name}`}
		>
			<CollapsibleTrigger asChild>
				<SidebarButton item={item} rightIcon={chevronIcon} />
			</CollapsibleTrigger>
			<CollapsibleContent className={cn('ml-6', 'flex', 'flex-col', 'gap-2')}>
				{children?.map((child: TreeMenuItem) => (
					<SidebarItem item={child} key={child.key || child.name} selectedKey={selectedKey} />
				))}
			</CollapsibleContent>
		</Collapsible>
	)
}

function SidebarItemDropdown({ item, selectedKey }: MenuItemProps) {
	const { children } = item
	const Link = useLink()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarButton item={item} />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" side="right">
				{children?.map((child: TreeMenuItem) => {
					const { key: childKey } = child
					const isSelected = childKey === selectedKey

					return (
						<DropdownMenuItem asChild key={childKey || child.name}>
							<Link
								className={cn('flex w-full items-center gap-2', {
									'bg-accent text-accent-foreground': isSelected
								})}
								to={child.route || ''}
							>
								<ItemIcon icon={child.meta?.icon ?? child.icon} isSelected={isSelected} />
								<span>{getDisplayName(child)}</span>
							</Link>
						</DropdownMenuItem>
					)
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

function SidebarItemGroup({ item, selectedKey }: MenuItemProps) {
	const { children } = item
	const { open } = useShadcnSidebar()

	return (
		<div className={cn('border-t', 'border-sidebar-border', 'pt-4')}>
			<span
				className={cn(
					'ml-3',
					'block',
					'text-xs',
					'font-semibold',
					'uppercase',
					'text-muted-foreground',
					'transition-all',
					'duration-200',
					{
						'h-0': !open,
						'h-8': open,
						'opacity-0': !open,
						'opacity-100': open,
						'pointer-events-auto': open,
						'pointer-events-none': !open
					}
				)}
			>
				{getDisplayName(item)}
			</span>
			{children && children.length > 0 && (
				<div className={cn('flex', 'flex-col')}>
					{children.map((child: TreeMenuItem) => (
						<SidebarItem item={child} key={child.key || child.name} selectedKey={selectedKey} />
					))}
				</div>
			)}
		</div>
	)
}

function SidebarItemLink({ item, selectedKey }: MenuItemProps) {
	const { pathname } = useParsed()
	// Check both exact match and path-based match for nested routes
	const isSelected =
		item.key === selectedKey || !!(item.route && pathname?.startsWith(item.route + '/'))

	return <SidebarButton asLink={true} isSelected={isSelected} item={item} />
}

Sidebar.displayName = 'Sidebar'
