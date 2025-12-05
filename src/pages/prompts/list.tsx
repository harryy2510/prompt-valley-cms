import { useMemo } from 'react'
import { useTable } from '@refinedev/react-table'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { useDelete, useNavigation, useSelect, useUpdate } from '@refinedev/core'
import { useLocalStorage } from 'usehooks-ts'
import dayjs from 'dayjs'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ListView,
  ListViewHeader,
} from '@/components/refine-ui/views/list-view'
import { DataTable } from '@/components/refine-ui/data-table/data-table'
import { DataTableSorter } from '@/components/refine-ui/data-table/data-table-sorter'
import {
  DataTableFilterClearButton,
  DataTableFilterCombobox,
} from '@/components/refine-ui/data-table/data-table-filter'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ActionButton } from '@/components/ui/action-button'
import {
  ColumnMapping,
  DataTableExport,
} from '@/components/refine-ui/data-table/data-table-export-import'
import { Tables } from '@/types/database.types'
import { fShortenNumber } from '@/utils/format'

type Prompt = Tables<'prompts'> & {
  categories: Pick<Tables<'categories'>, 'id' | 'name'> | null
  prompt_tags: { tags: Pick<Tables<'tags'>, 'id' | 'name'> }[]
  prompt_models: { ai_models: Pick<Tables<'ai_models'>, 'id' | 'name'> }[]
}

const STORAGE_KEY = 'prompts-column-visibility'

type ExportPrompt = {
  id: string
  title: string
  description: string | null
  content: string
  category_id: string | null
  tier: string
  is_published: boolean
  is_featured: boolean
  tag_ids: string
  model_ids: string
  created_at: string
}

const EXPORT_COLUMNS: ColumnMapping<ExportPrompt>[] = [
  { key: 'id', header: 'ID', example: 'my-prompt-slug' },
  { key: 'title', header: 'Title', example: 'My Prompt' },
  { key: 'description', header: 'Description', example: 'A useful prompt' },
  { key: 'content', header: 'Content', example: 'Prompt content here...' },
  { key: 'category_id', header: 'Category ID', example: 'marketing' },
  { key: 'tier', header: 'Tier', example: 'free' },
  { key: 'is_published', header: 'Published', example: 'true' },
  { key: 'is_featured', header: 'Featured', example: 'false' },
  { key: 'tag_ids', header: 'Tag IDs', example: 'seo,copywriting' },
  { key: 'model_ids', header: 'Model IDs', example: 'gpt-4o,claude-3' },
  { key: 'created_at', header: 'Created At', example: '' },
]

function transformPromptsForExport(prompts: Prompt[]): ExportPrompt[] {
  return prompts.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    content: p.content,
    category_id: p.category_id,
    tier: p.tier,
    is_published: p.is_published,
    is_featured: p.is_featured,
    tag_ids: p.prompt_tags?.map((pt) => pt.tags.id).join(', ') || '',
    model_ids: p.prompt_models?.map((pm) => pm.ai_models.id).join(', ') || '',
    created_at: p.created_at,
  }))
}

const TIER_OPTIONS = [
  { label: 'Free', value: 'free' },
  { label: 'Pro', value: 'pro' },
]

const STATUS_OPTIONS = [
  { label: 'Published', value: 'true' },
  { label: 'Draft', value: 'false' },
]

export function PromptsList() {
  const { edit, show } = useNavigation()
  const { mutateAsync: deletePrompt } = useDelete()
  const { mutateAsync: updatePrompt } = useUpdate()
  const [columnVisibility, setColumnVisibility] =
    useLocalStorage<VisibilityState>(STORAGE_KEY, {})

  const { options: categoryOptions } = useSelect<Tables<'categories'>>({
    resource: 'categories',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 1000 },
  })

  const { options: tagOptions } = useSelect<Tables<'tags'>>({
    resource: 'tags',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 1000 },
  })

  const { options: modelOptions } = useSelect<Tables<'ai_models'>>({
    resource: 'ai_models',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 1000 },
  })

  const columns = useMemo<ColumnDef<Prompt>[]>(
    () => [
      {
        id: 'title',
        accessorKey: 'title',
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>Title</span>
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ row }) => (
          <>
            <div className="font-medium">{row.original.title}</div>
            <div className="text-xs text-muted-foreground font-mono">
              {row.original.id}
            </div>
          </>
        ),
      },
      {
        id: 'category_id',
        accessorKey: 'category_id',
        header: ({ column, table }) => (
          <div className="flex items-center gap-1">
            <span>Category</span>
            <DataTableSorter column={column} />
            <DataTableFilterCombobox
              column={column}
              options={categoryOptions}
              table={table}
              operators={['eq']}
              defaultOperator="eq"
            />
            <DataTableFilterClearButton column={column} />
          </div>
        ),
        cell: ({ row }) => {
          const category = row.original.categories
          if (!category) {
            return <span className="text-muted-foreground">—</span>
          }
          return <span className="text-sm">{category.name}</span>
        },
      },
      {
        id: 'tag_id',
        accessorKey: 'tag_id',
        header: ({ column, table }) => (
          <div className="flex items-center gap-1">
            <span>Tags</span>
            <DataTableFilterCombobox
              column={column}
              options={tagOptions}
              table={table}
              operators={['eq']}
              defaultOperator="eq"
            />
            <DataTableFilterClearButton column={column} />
          </div>
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const tags = row.original.prompt_tags?.map((pt) => pt.tags) ?? []
          if (tags.length === 0) {
            return <span className="text-muted-foreground">—</span>
          }
          const displayTags = tags.slice(0, 2)
          const remaining = tags.length - 2
          return (
            <div className="flex flex-wrap gap-1">
              {displayTags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
              {remaining > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs cursor-default">
                      +{remaining}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <ul className="text-xs">
                      {tags.slice(2).map((tag) => (
                        <li key={tag.id}>{tag.name}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )
        },
      },
      {
        id: 'model_id',
        accessorKey: 'model_id',
        header: ({ column, table }) => (
          <div className="flex items-center gap-1">
            <span>Models</span>
            <DataTableFilterCombobox
              column={column}
              options={modelOptions}
              table={table}
              operators={['eq']}
              defaultOperator="eq"
            />
            <DataTableFilterClearButton column={column} />
          </div>
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const models =
            row.original.prompt_models?.map((pm) => pm.ai_models) ?? []
          if (models.length === 0) {
            return <span className="text-muted-foreground">—</span>
          }
          const displayModels = models.slice(0, 2)
          const remaining = models.length - 2
          return (
            <div className="flex flex-wrap gap-1">
              {displayModels.map((model) => (
                <Badge key={model.id} variant="outline" className="text-xs">
                  {model.name}
                </Badge>
              ))}
              {remaining > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs cursor-default">
                      +{remaining}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <ul className="text-xs">
                      {models.slice(2).map((model) => (
                        <li key={model.id}>{model.name}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )
        },
      },
      {
        id: 'tier',
        accessorKey: 'tier',
        header: ({ column, table }) => (
          <div className="flex items-center gap-1">
            <span>Tier</span>
            <DataTableSorter column={column} />
            <DataTableFilterCombobox
              column={column}
              options={TIER_OPTIONS}
              table={table}
              operators={['eq']}
              defaultOperator="eq"
            />
            <DataTableFilterClearButton column={column} />
          </div>
        ),
        cell: ({ getValue }) => {
          const tier = getValue() as 'free' | 'pro'
          return (
            <Badge
              variant={tier === 'pro' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {tier}
            </Badge>
          )
        },
      },
      {
        id: 'is_published',
        accessorKey: 'is_published',
        header: ({ column, table }) => (
          <div className="flex items-center gap-1">
            <span>Published</span>
            <DataTableSorter column={column} />
            <DataTableFilterCombobox
              column={column}
              options={STATUS_OPTIONS}
              table={table}
              operators={['eq']}
              defaultOperator="eq"
            />
            <DataTableFilterClearButton column={column} />
          </div>
        ),
        cell: ({ row }) => {
          const isPublished = row.original.is_published
          return (
            <Switch
              checked={isPublished}
              onCheckedChange={async (checked) => {
                await updatePrompt({
                  resource: 'prompts',
                  id: row.original.id,
                  values: { is_published: checked },
                  mutationMode: 'optimistic',
                })
              }}
            />
          )
        },
      },
      {
        id: 'is_featured',
        accessorKey: 'is_featured',
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>Featured</span>
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ row }) => {
          const isFeatured = row.original.is_featured
          return (
            <Switch
              checked={isFeatured}
              onCheckedChange={async (checked) => {
                await updatePrompt({
                  resource: 'prompts',
                  id: row.original.id,
                  values: { is_featured: checked },
                  mutationMode: 'optimistic',
                })
              }}
            />
          )
        },
      },
      {
        id: 'views_count',
        accessorKey: 'views_count',
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>Views</span>
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ getValue }) => {
          const count = getValue() as number
          return (
            <span className="text-sm tabular-nums">
              {fShortenNumber(count || 0)}
            </span>
          )
        },
      },
      {
        id: 'created_at',
        accessorKey: 'created_at',
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>Created</span>
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ getValue }) => {
          const value = getValue() as string
          return (
            <span className="text-sm text-muted-foreground">
              {dayjs(value).format('DD MMM, YYYY')}
            </span>
          )
        },
      },
      {
        id: 'updated_at',
        accessorKey: 'updated_at',
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>Updated</span>
            <DataTableSorter column={column} />
          </div>
        ),
        cell: ({ getValue }) => {
          const value = getValue() as string
          return (
            <span className="text-sm text-muted-foreground">
              {dayjs(value).format('DD MMM, YYYY')}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        size: 120,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => show('prompts', row.original.id)}
            >
              <Eye className="size-4" />
              <span className="sr-only">View</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => edit('prompts', row.original.id)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <ActionButton
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              requireAreYouSure
              areYouSureTitle="Delete Prompt?"
              areYouSureDescription={
                <>
                  This will permanently delete the prompt "{row.original.title}
                  ". This action cannot be undone.
                </>
              }
              confirmLabel="Delete"
              action={async () => {
                await deletePrompt({
                  resource: 'prompts',
                  id: row.original.id,
                })
                return { error: false }
              }}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Delete</span>
            </ActionButton>
          </div>
        ),
      },
    ],
    [edit, show, deletePrompt, categoryOptions, tagOptions, modelOptions],
  )

  const table = useTable<Prompt>({
    enableMultiSort: false,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    refineCoreProps: {
      resource: 'prompts',
      meta: {
        select:
          '*, categories(id, name), prompt_tags(tags(id, name)), prompt_models(ai_models(id, name))',
      },
      sorters: {
        initial: [{ field: 'created_at', order: 'desc' }],
      },
    },
  })

  const tableData = table.refineCore.tableQuery.data?.data ?? []
  const exportData = transformPromptsForExport(tableData)

  return (
    <ListView>
      <ListViewHeader
        table={table}
        action={
          <DataTableExport
            data={exportData}
            filename="prompts"
            columns={EXPORT_COLUMNS}
          />
        }
      />
      <DataTable table={table} />
    </ListView>
  )
}
