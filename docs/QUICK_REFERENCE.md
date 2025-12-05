# Quick Reference Guide

## 🚨 Fix the Table Error First!

### **Problem:**

```
Uncaught TypeError: table.getHeaderGroups is not a function
```

### **Solution:**

In all list pages (`ai-providers`, `ai-models`, `categories`), the `useTable` hook returns a TanStack Table instance directly. You're using it correctly! The error might be something else.

**Double-check this pattern:**

```typescript
const table = useTable<Type>({
	columns,
	refineCoreProps: { resource: 'resource_name' }
})

// Then use:
table.getHeaderGroups()
table.getRowModel()
// etc.
```

If the error persists, try:

```typescript
const tableInstance = useTable<Type>({ ... })
console.log(tableInstance) // Check what's actually returned
```

---

## 📁 Quick Copy-Paste Templates

### **1. Simple List + Create + Edit (like Categories/Tags)**

**List Page:**

```typescript
import { useTable } from '@refinedev/react-table'
import { type ColumnDef } from '@tanstack/react-table'

const columns = useMemo<ColumnDef<Type>[]>(() => [
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  // actions column...
], [])

const table = useTable<Type>({
  columns,
  refineCoreProps: { resource: 'resource_name' },
})
```

**Create/Edit Forms:**

```typescript
const schema = z.object({
	id: z.string().min(1),
	name: z.string().min(1)
})

const {
	refineCore: { onFinish, formLoading },
	...form
} = useForm<z.infer<typeof schema>>({
	resolver: zodResolver(schema),
	defaultValues: { id: '', name: '' },
	refineCoreProps: {
		resource: 'resource_name',
		action: 'create', // or 'edit'
		redirect: 'list'
	}
})
```

---

### **2. With Relationships (like AI Models → Providers)**

```typescript
const { options: providerOptions } = useSelect({
  resource: 'ai_providers',
  optionLabel: 'name',
  optionValue: 'id',
})

// Then in form:
<FormField
  control={form.control}
  name="provider_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Provider *</FormLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {providerOptions?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormItem>
  )}
/>
```

---

### **3. Auto-Slug Generation**

```typescript
const [autoSlug, setAutoSlug] = useState(true)

const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const handleNameChange = (name: string) => {
  form.setValue('name', name)
  if (autoSlug) {
    form.setValue('id', generateSlug(name))
  }
}

// In name field:
<Input onChange={(e) => handleNameChange(e.target.value)} />

// In ID field:
<Input onChange={(e) => { field.onChange(e); setAutoSlug(false) }} />
```

---

### **4. Array Management (like Capabilities)**

```typescript
const addItem = (item: string) => {
  const current = form.getValues('items')
  if (!current.includes(item)) {
    form.setValue('items', [...current, item])
  }
}

const removeItem = (item: string) => {
  const current = form.getValues('items')
  form.setValue('items', current.filter((i) => i !== item))
}

// UI:
{field.value.map((item) => (
  <Badge key={item} variant="secondary">
    {item}
    <button onClick={() => removeItem(item)}>
      <X className="size-3" />
    </button>
  </Badge>
))}
```

---

### **5. Delete Confirmation**

```typescript
const [deleteDialog, setDeleteDialog] = useState<{
  open: boolean
  id: string
  name: string
} | null>(null)

const { mutate: deleteResource } = useDelete()

const handleDelete = () => {
  if (!deleteDialog) return
  deleteResource({
    resource: 'resource_name',
    id: deleteDialog.id,
  }, {
    onSuccess: () => setDeleteDialog(null),
  })
}

// Trigger:
<Button onClick={() => setDeleteDialog({ open: true, id, name })}>
  Delete
</Button>

// Dialog:
<AlertDialog open={deleteDialog?.open}>
  {/* ... AlertDialog content ... */}
  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
</AlertDialog>
```

---

### **6. Loading States**

```typescript
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'

// In forms:
<LoadingOverlay loading={formLoading}>
  {/* form content */}
</LoadingOverlay>

// In edit forms (loading data):
<LoadingOverlay loading={query?.isLoading || formLoading}>
  {!query?.isLoading && (
    <Form>...</Form>
  )}
</LoadingOverlay>
```

---

## 🎨 UI Patterns

### **Empty State:**

```typescript
<TableCell colSpan={columns.length} className="h-32 text-center">
  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
      <Plus className="size-6" />
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium">No items yet</p>
      <p className="text-xs">Get started by adding your first item</p>
    </div>
  </div>
</TableCell>
```

### **Dropdown Actions:**

```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="size-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => edit('resource', id)}>
      <Pencil className="mr-2 size-4" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
      <Trash2 className="mr-2 size-4" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### **Card Form Layout:**

```typescript
<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardDescription>Description here</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* form fields */}
  </CardContent>
</Card>
```

---

## ⚡ Common Zod Schemas

### **Basic (Name + ID):**

```typescript
const schema = z.object({
	id: z.string().min(1, 'ID is required'),
	name: z.string().min(1, 'Name is required')
})
```

### **With Optional Fields:**

```typescript
const schema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	description: z.string().optional(),
	website_url: z.string().url().optional().or(z.literal(''))
})
```

### **With Numbers:**

```typescript
const schema = z.object({
	id: z.string().min(1),
	price: z.coerce.number().positive().optional().nullable(),
	quantity: z.coerce.number().int().min(0)
})
```

### **With Arrays:**

```typescript
const schema = z.object({
	id: z.string().min(1),
	tags: z.array(z.string()).default([]),
	capabilities: z.array(z.string()).min(1, 'At least one required')
})
```

---

## 🔧 Useful Hooks

### **From Refine Core:**

```typescript
import { useNavigation, useDelete, useSelect } from '@refinedev/core'

const { create, edit, list, show } = useNavigation()
const { mutate: deleteItem } = useDelete()
const { options } = useSelect({ resource: 'name' })
```

### **From Refine React Table:**

```typescript
import { useTable } from '@refinedev/react-table'

const table = useTable({ columns, refineCoreProps: { resource } })
```

### **From Refine React Hook Form:**

```typescript
import { useForm } from '@refinedev/react-hook-form'

const { refineCore, ...form } = useForm({
	/* config */
})
// refineCore has: onFinish, formLoading, query (for edit)
// form has: control, handleSubmit, setValue, getValues, watch, etc.
```

---

## 📦 Imports You'll Need

```typescript
// Refine
import { useNavigation, useDelete, useSelect } from '@refinedev/core'
import { useTable } from '@refinedev/react-table'
import { useForm } from '@refinedev/react-hook-form'
import { type ColumnDef } from '@tanstack/react-table'

// React
import { useState, useMemo } from 'react'
import { useParams } from 'react-router'

// Validation
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormDescription
} from '@/components/ui/form'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'

// Icons
import { Plus, Pencil, Trash2, MoreHorizontal, X } from 'lucide-react'

// Refine UI
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'
```

---

## 🎯 Quick Wins

### **1. Complete Tags (5 minutes):**

Copy `src/pages/categories/index.tsx` → `src/pages/tags/index.tsx`
Replace: "Category" → "Tag", "categories" → "tags"

### **2. Test Notifications (2 minutes):**

Create/edit/delete any resource → See toasts!

### **3. Test Theme Switching (1 minute):**

Toggle theme in browser DevTools or add a theme toggle button

### **4. Fix Table Error (debugging):**

Add `console.log(table)` in list pages to see what's returned

---

## 🚀 Next Steps (In Order)

1. **Fix table error** (if it persists after checking)
2. **Complete Tags** (copy Categories pattern)
3. **Test everything** (CRUD operations, notifications)
4. **Refactor Dashboard** (simple - use `useList`)
5. **Refactor Prompts** (complex - multi-select, images)

---

## 💡 Pro Tips

1. **Always use `useMemo` for columns** - Prevents re-renders
2. **Destructure `refineCore` from `useForm`** - Access onFinish, formLoading, query
3. **Use LoadingOverlay** - Consistent loading UX
4. **Let Refine handle notifications** - Don't call toast manually
5. **Use Zod for all forms** - Type safety + validation
6. **Disable ID field in edit mode** - `<Input disabled />`
7. **Auto-redirect after CRUD** - `redirect: 'list'` in refineCoreProps

---

## ✅ Checklist for New Resources

- [ ] Define TypeScript type
- [ ] Create Zod schema
- [ ] Implement List with `useTable`
- [ ] Define columns with `useMemo`
- [ ] Add empty state
- [ ] Add dropdown actions
- [ ] Implement Create with `useForm`
- [ ] Add auto-slug if needed
- [ ] Add LoadingOverlay
- [ ] Implement Edit with `useForm`
- [ ] Load existing data with query
- [ ] Disable ID field
- [ ] Add delete confirmation
- [ ] Test all CRUD operations
- [ ] Verify notifications work
- [ ] Check loading states

---

That's it! You now have everything you need to quickly refactor any resource! 🎉
