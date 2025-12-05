import React, { useState, useEffect } from 'react'
import {
  useMenu,
  useLink,
  useRefineOptions,
  useParsed,
  TreeMenuItem,
} from '@refinedev/core'
import { getSupabaseBrowserClient } from '@/libs/supabase/client'
import { FolderOpen } from 'lucide-react'
import {
  SidebarRail as ShadcnSidebarRail,
  Sidebar as ShadcnSidebar,
  SidebarContent as ShadcnSidebarContent,
  SidebarHeader as ShadcnSidebarHeader,
  useSidebar as useShadcnSidebar,
  SidebarTrigger as ShadcnSidebarTrigger,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { ChevronRight, ListIcon } from 'lucide-react'
import { cn } from '@/libs/cn'

export function Sidebar() {
  const { open } = useShadcnSidebar()
  const { menuItems, selectedKey } = useMenu()

  return (
    <ShadcnSidebar collapsible="icon" className={cn('border-none')}>
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
            'px-3': open,
            'px-1': !open,
          },
        )}
      >
        {menuItems.map((item: TreeMenuItem) => (
          <SidebarItem
            key={item.key || item.name}
            item={item}
            selectedKey={selectedKey}
          />
        ))}
      </ShadcnSidebarContent>
    </ShadcnSidebar>
  )
}

type MenuItemProps = {
  item: TreeMenuItem
  selectedKey?: string
}

function SidebarItem({ item, selectedKey }: MenuItemProps) {
  const { open } = useShadcnSidebar()

  if (item.meta?.group) {
    return <SidebarItemGroup item={item} selectedKey={selectedKey} />
  }

  // Special handling for media-library to show buckets as children
  if (item.name === 'media-library') {
    if (open) {
      return (
        <MediaLibrarySidebarItem item={item} selectedKey={selectedKey} />
      )
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
            'h-8': open,
            'h-0': !open,
            'opacity-0': !open,
            'opacity-100': open,
            'pointer-events-none': !open,
            'pointer-events-auto': open,
          },
        )}
      >
        {getDisplayName(item)}
      </span>
      {children && children.length > 0 && (
        <div className={cn('flex', 'flex-col')}>
          {children.map((child: TreeMenuItem) => (
            <SidebarItem
              key={child.key || child.name}
              item={child}
              selectedKey={selectedKey}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SidebarItemCollapsible({ item, selectedKey }: MenuItemProps) {
  const { name, children } = item

  // Check if any child is selected to determine if we should default to open
  const hasSelectedChild = children?.some(
    (child: TreeMenuItem) => child.key === selectedKey,
  )

  const chevronIcon = (
    <ChevronRight
      className={cn(
        'h-4',
        'w-4',
        'shrink-0',
        'text-muted-foreground',
        'transition-transform',
        'duration-200',
        'group-data-[state=open]:rotate-90',
      )}
    />
  )

  return (
    <Collapsible
      key={`collapsible-${name}`}
      className={cn('w-full', 'group')}
      defaultOpen={hasSelectedChild || true}
    >
      <CollapsibleTrigger asChild>
        <SidebarButton item={item} rightIcon={chevronIcon} />
      </CollapsibleTrigger>
      <CollapsibleContent className={cn('ml-6', 'flex', 'flex-col', 'gap-2')}>
        {children?.map((child: TreeMenuItem) => (
          <SidebarItem
            key={child.key || child.name}
            item={child}
            selectedKey={selectedKey}
          />
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
      <DropdownMenuContent side="right" align="start">
        {children?.map((child: TreeMenuItem) => {
          const { key: childKey } = child
          const isSelected = childKey === selectedKey

          return (
            <DropdownMenuItem key={childKey || child.name} asChild>
              <Link
                to={child.route || ''}
                className={cn('flex w-full items-center gap-2', {
                  'bg-accent text-accent-foreground': isSelected,
                })}
              >
                <ItemIcon
                  icon={child.meta?.icon ?? child.icon}
                  isSelected={isSelected}
                />
                <span>{getDisplayName(child)}</span>
              </Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SidebarItemLink({ item, selectedKey }: MenuItemProps) {
  const { pathname } = useParsed()
  // Check both exact match and path-based match for nested routes
  const isSelected =
    item.key === selectedKey ||
    !!(item.route && pathname?.startsWith(item.route + '/'))

  return <SidebarButton item={item} isSelected={isSelected} asLink={true} />
}

type Bucket = {
  id: string
  name: string
  public: boolean
  created_at: string
}

function MediaLibrarySidebarItem({ item, selectedKey }: MenuItemProps) {
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { pathname } = useParsed()
  const Link = useLink()

  useEffect(() => {
    const loadBuckets = async () => {
      try {
        const { data } = await supabase.storage.listBuckets()
        setBuckets(data || [])
      } catch (error) {
        console.error('Failed to load buckets:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadBuckets()
  }, [])

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
        'group-data-[state=open]:rotate-90',
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
          variant="ghost"
          size="lg"
          className={cn(
            'flex flex-1 items-center justify-start gap-2 py-2 !px-3 text-sm',
            {
              'bg-sidebar-primary': isParentSelected,
              'hover:!bg-sidebar-primary/90': isParentSelected,
              'text-sidebar-primary-foreground': isParentSelected,
              'hover:text-sidebar-primary-foreground': isParentSelected,
            },
          )}
        >
          <Link to="/media-library" className="flex w-full items-center gap-2">
            <ItemIcon
              icon={item.meta?.icon ?? item.icon}
              isSelected={isParentSelected}
            />
            <span
              className={cn('flex-1 text-left tracking-[-0.00875rem]', {
                'font-normal': !isParentSelected,
                'font-semibold': isParentSelected,
                'text-sidebar-primary-foreground': isParentSelected,
                'text-foreground': !isParentSelected,
              })}
            >
              {getDisplayName(item)}
            </span>
          </Link>
        </Button>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
            {chevronIcon}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className={cn('ml-6', 'flex', 'flex-col', 'gap-1')}>
        {isLoading ? (
          <span className="text-xs text-muted-foreground px-3 py-2">
            Loading...
          </span>
        ) : buckets.length === 0 ? (
          <span className="text-xs text-muted-foreground px-3 py-2">
            No buckets
          </span>
        ) : (
          buckets.map((bucket) => {
            const bucketPath = `/media-library/${bucket.id}`
            const isBucketSelected = pathname?.startsWith(bucketPath) ?? false

            return (
              <Button
                key={bucket.id}
                asChild
                variant="ghost"
                size="lg"
                className={cn(
                  'flex w-full items-center justify-start gap-2 py-2 !px-3 text-sm',
                  {
                    'bg-sidebar-primary': isBucketSelected,
                    'hover:!bg-sidebar-primary/90': isBucketSelected,
                    'text-sidebar-primary-foreground': isBucketSelected,
                    'hover:text-sidebar-primary-foreground': isBucketSelected,
                  },
                )}
              >
                <Link
                  to={bucketPath}
                  className="flex w-full items-center gap-2"
                >
                  <ItemIcon
                    icon={<FolderOpen className="size-4" />}
                    isSelected={isBucketSelected}
                  />
                  <span
                    className={cn('truncate tracking-[-0.00875rem]', {
                      'font-normal': !isBucketSelected,
                      'font-semibold': isBucketSelected,
                      'text-sidebar-primary-foreground': isBucketSelected,
                      'text-foreground': !isBucketSelected,
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

function MediaLibrarySidebarItemDropdown({ item, selectedKey }: MenuItemProps) {
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const { pathname } = useParsed()
  const Link = useLink()

  useEffect(() => {
    const loadBuckets = async () => {
      try {
        const { data } = await supabase.storage.listBuckets()
        setBuckets(data || [])
      } catch (error) {
        console.error('Failed to load buckets:', error)
      }
    }
    loadBuckets()
  }, [])

  const isParentSelected = pathname === '/media-library'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="lg"
          className={cn(
            'flex w-full items-center justify-start gap-2 py-2 !px-3 text-sm',
            {
              'bg-sidebar-primary': isParentSelected,
              'hover:!bg-sidebar-primary/90': isParentSelected,
              'text-sidebar-primary-foreground': isParentSelected,
              'hover:text-sidebar-primary-foreground': isParentSelected,
            },
          )}
        >
          <ItemIcon
            icon={item.meta?.icon ?? item.icon}
            isSelected={isParentSelected}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start">
        <DropdownMenuItem asChild>
          <Link
            to="/media-library"
            className={cn('flex w-full items-center gap-2', {
              'bg-accent text-accent-foreground': isParentSelected,
            })}
          >
            <ItemIcon
              icon={item.meta?.icon ?? item.icon}
              isSelected={isParentSelected}
            />
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
                <DropdownMenuItem key={bucket.id} asChild>
                  <Link
                    to={bucketPath}
                    className={cn('flex w-full items-center gap-2', {
                      'bg-accent text-accent-foreground': isBucketSelected,
                    })}
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

function SidebarHeader() {
  const { title } = useRefineOptions()
  const { open, isMobile } = useShadcnSidebar()

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
        'overflow-hidden',
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
            'pl-5': open,
          },
        )}
      >
        <div>{title.icon}</div>
        <h2
          className={cn(
            'text-sm',
            'font-bold',
            'transition-opacity',
            'duration-200',
            {
              'opacity-0': !open,
              'opacity-100': open,
            },
          )}
        >
          {title.text}
        </h2>
      </div>

      <ShadcnSidebarTrigger
        className={cn('text-muted-foreground', 'mr-1.5', {
          'opacity-0': !open,
          'opacity-100': open || isMobile,
          'pointer-events-auto': open || isMobile,
          'pointer-events-none': !open && !isMobile,
        })}
      />
    </ShadcnSidebarHeader>
  )
}

function getDisplayName(item: TreeMenuItem) {
  return item.meta?.label ?? item.label ?? item.name
}

type IconProps = {
  icon: React.ReactNode
  isSelected?: boolean
}

function ItemIcon({ icon, isSelected }: IconProps) {
  return (
    <div
      className={cn('w-4', {
        'text-muted-foreground': !isSelected,
        'text-sidebar-primary-foreground': isSelected,
      })}
    >
      {icon ?? <ListIcon />}
    </div>
  )
}

type SidebarButtonProps = React.ComponentProps<typeof Button> & {
  item: TreeMenuItem
  isSelected?: boolean
  rightIcon?: React.ReactNode
  asLink?: boolean
  onClick?: () => void
}

function SidebarButton({
  item,
  isSelected = false,
  rightIcon,
  asLink = false,
  className,
  onClick,
  ...props
}: SidebarButtonProps) {
  const Link = useLink()

  const buttonContent = (
    <>
      <ItemIcon icon={item.meta?.icon ?? item.icon} isSelected={isSelected} />
      <span
        className={cn('tracking-[-0.00875rem]', {
          'flex-1': rightIcon,
          'text-left': rightIcon,
          'line-clamp-1': !rightIcon,
          truncate: !rightIcon,
          'font-normal': !isSelected,
          'font-semibold': isSelected,
          'text-sidebar-primary-foreground': isSelected,
          'text-foreground': !isSelected,
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
      variant="ghost"
      size="lg"
      className={cn(
        'flex w-full items-center justify-start gap-2 py-2 !px-3 text-sm',
        {
          'bg-sidebar-primary': isSelected,
          'hover:!bg-sidebar-primary/90': isSelected,
          'text-sidebar-primary-foreground': isSelected,
          'hover:text-sidebar-primary-foreground': isSelected,
        },
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {asLink && item.route ? (
        <Link to={item.route} className={cn('flex w-full items-center gap-2')}>
          {buttonContent}
        </Link>
      ) : (
        buttonContent
      )}
    </Button>
  )
}

Sidebar.displayName = 'Sidebar'
