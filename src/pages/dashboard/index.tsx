import { useList } from "@refinedev/core"
import {FileText, FolderTree, Tags, Cpu, Brain, Bot, Package} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-layout"

export function DashboardPage() {
  const { result: promptsResult } = useList({ resource: "prompts", pagination: { pageSize: 1 } })
  const { result: categoriesResult } = useList({ resource: "categories", pagination: { pageSize: 1 } })
  const { result: tagsResult } = useList({ resource: "tags", pagination: { pageSize: 1 } })
  const { result: modelsResult } = useList({ resource: "ai_models", pagination: { pageSize: 1 } })
  const { result: providersResult } = useList({ resource: "ai_providers", pagination: { pageSize: 1 } })

  const stats = [
      {
          label: "AI Providers",
          value: providersResult?.total || 0,
          icon: Bot,
      },
      {
          label: "AI Models",
          value: modelsResult?.total || 0,
          icon: Package,
      },
    {
      label: "Categories",
      value: categoriesResult?.total || 0,
      icon: FolderTree,
    },
    {
      label: "Tags",
      value: tagsResult?.total || 0,
      icon: Tags,
    },
      {
          label: "Prompts",
          value: promptsResult?.total || 0,
          icon: FileText,
      },
  ]

  return (
    <div className="mx-auto w-full">
      <PageHeader
        title="Dashboard"
        description="Overview of your PromptValley CMS"
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
