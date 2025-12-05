# CMS Code Patterns

## Directory Structure
```
src/pages/{resource}/
├── index.ts              # Re-exports all components
├── list.tsx              # List view with DataTable
├── create.tsx            # Simple wrapper for form
├── edit.tsx              # Simple wrapper for form
├── show.tsx              # (optional) Read-only view
└── components/
    └── {resource}-form.tsx  # Shared form component
```

## List Page Pattern (`list.tsx`)

### Imports
```tsx
import { useMemo } from 'react'
import { useTable } from '@refinedev/react-table'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { Pencil, Trash2 } from 'lucide-react'
import { useDelete, useNavigation } from '@refinedev/core'
import { useLocalStorage } from 'usehooks-ts'
import dayjs from 'dayjs'

import { ListView, ListViewHeader } from '@/components/refine-ui/views/list-view'
import { DataTable } from '@/components/refine-ui/data-table/data-table'
import { DataTableSorter } from '@/components/refine-ui/data-table/data-table-sorter'
import { DataTableFilterCombobox } from '@/components/refine-ui/data-table/data-table-filter'
import { Button } from '@/components/ui/button'
import { ActionButton } from '@/components/ui/action-button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Tables } from '@/types/database.types'
```

### Type Definition
```tsx
// Simple table
type Resource = Tables<'resource_name'>

// With relations
type Resource = Tables<'resource_name'> & {
  related_table: Pick<Tables<'related_table'>, 'id' | 'name'>[]
  // For counts: related_table: { count: number }[]
}
```

### Component Structure
```tsx
const STORAGE_KEY = 'resource-column-visibility'

export function ResourceList() {
  const { edit } = useNavigation()
  const { mutateAsync: deleteResource } = useDelete()  // Use mutateAsync, not mutate
  const [columnVisibility, setColumnVisibility] =
    useLocalStorage<VisibilityState>(STORAGE_KEY, {})

  // Optional: fetch options for filter dropdowns
  const { options: filterOptions } = useSelect<Tables<'other_table'>>({
    resource: 'other_table',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 1000 },
  })

  const columns = useMemo<ColumnDef<Resource>[]>(
    () => [
      // ... column definitions
    ],
    [edit, deleteResource, /* filterOptions if used */],
  )

  const table = useTable<Resource>({
    enableMultiSort: false,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    refineCoreProps: {
      resource: 'resource_name',
      meta: {
        select: '*, related_table(id, name)',  // Optional
      },
      sorters: {
        initial: [{ field: 'created_at', order: 'desc' }],
      },
    },
  })

  return (
    <ListView>
      <ListViewHeader table={table} />
      <DataTable table={table} />
    </ListView>
  )
}
```

### Column Patterns

#### Name Column (Primary)
```tsx
{
  id: 'name',
  accessorKey: 'name',
  header: ({ column }) => (
    <div className="flex items-center gap-1">
      <span>Name</span>
      <DataTableSorter column={column} />
    </div>
  ),
  cell: ({ row }) => (
    <>
      <div className="font-medium">{row.original.name}</div>
      <div className="text-xs text-muted-foreground font-mono">
        {row.original.id}
      </div>
    </>
  ),
}
```

#### With Filter Dropdown
```tsx
{
  id: 'field_id',
  accessorKey: 'field_id',
  header: ({ column, table }) => (
    <div className="flex items-center gap-1">
      <span>Field</span>
      <DataTableSorter column={column} />
      <DataTableFilterCombobox
        column={column}
        options={filterOptions}
        table={table}
        operators={['eq']}
        defaultOperator="eq"
      />
    </div>
  ),
}
```

#### Date Column
```tsx
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
}
```

#### Actions Column
```tsx
{
  id: 'actions',
  header: '',
  enableSorting: false,
  enableHiding: false,
  size: 80,
  cell: ({ row }) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => edit('resource_name', row.original.id)}
      >
        <Pencil className="size-4" />
        <span className="sr-only">Edit</span>
      </Button>
      <ActionButton
        variant="ghost"
        size="icon"
        className="size-8 text-destructive"
        requireAreYouSure
        areYouSureTitle="Delete Resource?"
        areYouSureDescription={
          <>
            This will permanently delete "{row.original.name}".
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        action={async () => {
          await deleteResource({
            resource: 'resource_name',
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
}
```

#### Tooltip on Hover (for related items)
```tsx
{
  id: 'related',
  header: 'Related',
  enableSorting: false,
  cell: ({ row }) => {
    const items = row.original.related_items ?? []
    const count = items.length
    if (count === 0) {
      return <span className="text-muted-foreground">—</span>
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={`/other-resource?filters[0][field]=field_id&filters[0][operator]=eq&filters[0][value]=${row.original.id}`}
            className="text-sm text-primary hover:underline"
          >
            {count} {count === 1 ? 'item' : 'items'}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-64">
          <ul className="text-xs">
            {items.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    )
  },
}
```

## Form Component Pattern (`components/{resource}-form.tsx`)

### Structure
```tsx
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MultiSelect, MultiSelectContent, MultiSelectGroup, MultiSelectItem, MultiSelectTrigger, MultiSelectValue } from '@/components/ui/multi-select'
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'
import { Tables } from '@/types/database.types'
import { FormAction, HttpError, useBack, useSelect } from '@refinedev/core'
import { useForm } from '@refinedev/react-hook-form'
import { getDefaultsForSchema } from 'zod-defaults'
import { zodResolver } from '@hookform/resolvers/zod'
import { slug, nullableNonNegativeNumber } from '@/utils/validations'
import { SlugField } from '@/components/forms/slug-field'

type Resource = Tables<'resource_name'>

export const resourceFormSchema = z.object({
  id: slug,
  name: z.string().min(1, 'Name is required'),
  // ... other fields
})

export type ResourceFormValues = z.infer<typeof resourceFormSchema>

interface ResourceFormProps {
  mode: Exclude<FormAction, 'clone'>
}

export function ResourceForm({ mode }: ResourceFormProps) {
  const isCreate = mode === 'create'
  const back = useBack()

  const {
    refineCore: { onFinish, formLoading, mutation },
    ...form
  } = useForm<Resource, HttpError, ResourceFormValues>({
    defaultValues: getDefaultsForSchema(resourceFormSchema),
    resolver: zodResolver(resourceFormSchema),
    refineCoreProps: {
      resource: 'resource_name',
      action: mode,
      redirect: 'list',
    },
  })

  // Optional: fetch options for selects
  const { options: relatedOptions } = useSelect<Tables<'related_table'>>({
    resource: 'related_table',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 1000 },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onFinish)}
        className="space-y-6 max-w-2xl"
      >
        <LoadingOverlay containerClassName="space-y-6" loading={formLoading}>
          <Card>
            <CardHeader>
              <CardTitle>Resource Information</CardTitle>
              <CardDescription>
                {isCreate
                  ? 'Enter the information for the resource'
                  : 'Update the resource information'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Form fields */}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={back}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? isCreate ? 'Creating...' : 'Saving...'
                : isCreate ? 'Create Resource' : 'Save'}
            </Button>
          </div>
        </LoadingOverlay>
      </form>
    </Form>
  )
}
```

### SlugField Usage
```tsx
<SlugField
  name="id"
  sourceValue={form.watch('name')}
  resource="resource_name"
  label="Resource ID *"
  description={
    isCreate
      ? 'Unique identifier for the resource'
      : 'The ID cannot be changed after creation'
  }
  placeholder="e.g. my-resource"
  disabled={!isCreate}
/>
```

## Create/Edit Page Pattern

### create.tsx
```tsx
import { CreateView, CreateViewHeader } from '@/components/refine-ui/views/create-view'
import { ResourceForm } from './components/resource-form'

export function ResourceCreate() {
  return (
    <CreateView>
      <CreateViewHeader title="Create Resource" />
      <ResourceForm mode="create" />
    </CreateView>
  )
}
```

### edit.tsx
```tsx
import { EditView, EditViewHeader } from '@/components/refine-ui/views/edit-view'
import { ResourceForm } from './components/resource-form'

export function ResourceEdit() {
  return (
    <EditView>
      <EditViewHeader title="Edit Resource" />
      <ResourceForm mode="edit" />
    </EditView>
  )
}
```

## Validation Patterns (`utils/validations.ts`)

```tsx
import { z } from 'zod'

// Slug validation for IDs
export const slug = z
  .string()
  .min(1, 'ID is required')
  .max(100, 'ID must be 100 characters or less')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'ID must be lowercase letters, numbers, and hyphens only (e.g. "my-model-1")',
  )

// Nullable non-negative number
export const nullableNonNegativeNumber = z
  .union([z.string(), z.number(), z.null()])
  .transform((val): number | null => {
    if (val === '' || val === null) return null
    return typeof val === 'number' ? val : Number(val)
  })
  .refine((val) => val === null || (Number.isFinite(val) && val >= 0), {
    message: 'Must be a non-negative number',
  })
```

## Formatting Utilities
- `dayjs(value).format('DD MMM, YYYY')` - Date formatting
- `fCurrency(value)` - Currency formatting
- `fShortenNumber(value)` - Number shortening (e.g., 128000 → 128K)
- `startCase(value)` - Title case (from lodash-es)

## Key Conventions
1. Always use `Tables<'table_name'>` from database types
2. Use `mutateAsync` (not `mutate`) for delete operations
3. Use `useLocalStorage` with `STORAGE_KEY` for column visibility persistence
4. Use `enableMultiSort: false` in useTable
5. Use `ActionButton` with `requireAreYouSure` for delete confirmations
6. Add `DataTableSorter` to sortable column headers
7. Add `created_at` and `updated_at` columns with dayjs formatting
8. Default sort by `created_at` desc
9. Empty values show `<span className="text-muted-foreground">—</span>`
10. Actions column: `enableSorting: false`, `enableHiding: false`, `size: 80`
