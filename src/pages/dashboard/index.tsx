import { useList } from "@refinedev/core"
import { FileText, FolderTree, Tags, Cpu, Brain } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DashboardPage() {
  const { data: promptsData } = useList({ resource: "prompts", pagination: { pageSize: 1 } })
  const { data: categoriesData } = useList({ resource: "categories", pagination: { pageSize: 1 } })
  const { data: tagsData } = useList({ resource: "tags", pagination: { pageSize: 1 } })
  const { data: modelsData } = useList({ resource: "ai_models", pagination: { pageSize: 1 } })
  const { data: providersData } = useList({ resource: "ai_providers", pagination: { pageSize: 1 } })

  const stats = [
    {
      label: "Total Prompts",
      value: promptsData?.total || 0,
      icon: FileText,
      description: "Active prompts in library",
    },
    {
      label: "Categories",
      value: categoriesData?.total || 0,
      icon: FolderTree,
      description: "Content categories",
    },
    {
      label: "Tags",
      value: tagsData?.total || 0,
      icon: Tags,
      description: "Total tags",
    },
    {
      label: "AI Models",
      value: modelsData?.total || 0,
      icon: Cpu,
      description: "Supported models",
    },
    {
      label: "AI Providers",
      value: providersData?.total || 0,
      icon: Brain,
      description: "AI providers",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your PromptValley CMS</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
