import { Link, useLocation } from 'react-router'
import { Bot, FileText, FolderTree, Package, Tags } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { LogoWithText } from '@/components/logo-with-text'
import { ThemeSelect } from '@/components/refine-ui/theme/theme-select'

const menuItems = [
  {
    title: 'AI Providers',
    url: '/ai-providers',
    icon: Bot,
  },
  {
    title: 'AI Models',
    url: '/ai-models',
    icon: Package,
  },
  {
    title: 'Categories',
    url: '/categories',
    icon: FolderTree,
  },
  {
    title: 'Tags',
    url: '/tags',
    icon: Tags,
  },
  {
    title: 'Prompts',
    url: '/prompts',
    icon: FileText,
  },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-4">
            <LogoWithText className="h-8 w-auto" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname.startsWith(item.url)}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
          <SidebarTrigger className="-ml-2" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between gap-2">
            <h1 className="text-sm font-semibold">CMS</h1>
            <ThemeSelect />
          </div>
        </header>
        <main className="flex flex-1 flex-col p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
