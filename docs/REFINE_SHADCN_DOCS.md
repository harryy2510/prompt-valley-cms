# Refine + shadcn/ui Components Documentation

Complete reference for all Refine shadcn/ui integration components.

---

## Table of Contents

1. [Basic Views](#basic-views)
   - [CreateView](#createview)
   - [EditView](#editview)
   - [ListView](#listview)
   - [ShowView](#showview)
2. [Layout & Theme](#layout--theme)
3. [Authentication](#authentication)
4. [Buttons](#buttons)
5. [Forms](#forms)
6. [Data Table](#data-table)
7. [Notifications](#notifications)

---

## Basic Views

### CreateView

**Installation:**

```bash
npx shadcn@latest add https://ui.refine.dev/r/views.json
```

**Imports:**

```typescript
import { CreateView, CreateViewHeader } from '@/components/refine-ui/views/create-view'
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'
```

**Basic Usage:**

```typescript
export default function PostCreatePage() {
  const formLoading = false;
  return (
    <CreateView>
      <CreateViewHeader />
      <LoadingOverlay loading={formLoading}>
        {/* Record content (e.g., Create Form) */}
      </LoadingOverlay>
    </CreateView>
  );
}
```

**Key Features:**

- Automatic back button navigation via `useBack()` hook
- Resource detection with auto-generated titles
- Built-in breadcrumb navigation support

**CreateView Props:**
| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `children` | `ReactNode` | — | Content rendered inside the view |
| `className` | `string` | — | Additional CSS classes for container |

**CreateViewHeader Props:**
| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `resource` | `string` | Current resource | Override resource name for title/actions |
| `title` | `string` | Auto-generated | Custom header title |
| `hideBreadcrumb` | `boolean` | `false` | Toggle breadcrumb visibility |
| `wrapperClassName` | `string` | — | Header wrapper CSS classes |
| `headerClassName` | `string` | — | Title/actions container CSS classes |

**Advanced Examples:**

Custom Title:

```typescript
<CreateViewHeader title="Add New Post" />
```

Hide Breadcrumb:

```typescript
<CreateViewHeader hideBreadcrumb={true} />
```

Custom CSS:

```typescript
<CreateView className="my-custom-create">
  <CreateViewHeader wrapperClassName="custom-wrapper" />
</CreateView>
```

With Form Loading:

```typescript
const { refineCore: { formLoading } } = useForm();
<LoadingOverlay loading={formLoading}>
  {/* form content */}
</LoadingOverlay>
```

---

### EditView

**Installation:**

```bash
npx shadcn@latest add https://ui.refine.dev/r/views.json
```

**Import Statement:**

```typescript
import { EditView, EditViewHeader } from '@/components/refine-ui/views/edit-view'
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'
```

**Core Props:**

**EditView:**

- `children` (ReactNode): Content to render inside the view
- `className` (string): Additional CSS classes for the container

**EditViewHeader:**

- `resource` (string): Override the resource name for title and actions
- `title` (string): Custom title for the header
- `hideBreadcrumb` (boolean, default: false): Hide breadcrumb navigation
- `wrapperClassName` (string): CSS classes for header's main wrapper
- `headerClassName` (string): CSS classes for title and actions container
- `actionsSlot` (ReactNode): Custom actions to render in the header

**Basic Usage Example:**

```typescript
export default function PostEditPage() {
  const queryLoading = false;
  const formLoading = false;
  const error = null;

  if (error) {
    return (
      <EditView>
        <EditViewHeader />
      </EditView>
    );
  }

  return (
    <EditView>
      <EditViewHeader />
      <LoadingOverlay loading={queryLoading || formLoading}>
        {/* Edit Form */}
      </LoadingOverlay>
    </EditView>
  );
}
```

**Key Features:**

- Automatic back/list button navigation
- Resource-based title generation
- Built-in breadcrumb navigation
- Integrated refresh button
- Loading overlay support for data and form states

---

### ListView

**Installation:**

```bash
npx shadcn@latest add https://ui.refine.dev/r/views.json
```

**Core Imports:**

```javascript
import { ListView, ListViewHeader } from '@/components/refine-ui/views/list-view'
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'
```

**Basic Structure:**
The component provides "a layout to display the page" with automatic resource detection and breadcrumb navigation capabilities.

**ListView Props:**
| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `children` | ReactNode | — | Page content |
| `className` | string | — | Container styling |

**ListViewHeader Props:**
| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `resource` | string | Current resource | Override resource name |
| `title` | string | Auto-generated | Custom header text |
| `hideBreadcrumb` | boolean | false | Toggle breadcrumb visibility |
| `wrapperClassName` | string | — | Header wrapper styles |
| `headerClassName` | string | — | Title/action container styles |
| `canCreate` | boolean | Resource default | Control create button display |

**Standard Implementation Pattern:**
Wrap content with ListView, add ListViewHeader for metadata, and use LoadingOverlay for async states.

**Key Features:**

- Automatic resource-based title generation
- Built-in breadcrumb navigation
- Conditional create button rendering
- Error state handling capability

---

### ShowView

**Installation:**

```bash
npx shadcn@latest add https://ui.refine.dev/r/views.json
```

**Imports:**

```typescript
import { ShowView, ShowViewHeader } from '@/components/refine-ui/views/show-view'
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'
```

**Props:**

**ShowView:**

- `children` (ReactNode): Content to render inside the view
- `className` (string): Additional CSS classes for the container

**ShowViewHeader:**

- `resource` (string): Override the resource name for title and actions
- `title` (string): Custom title for the header
- `hideBreadcrumb` (boolean, default: false): Hide breadcrumb navigation
- `wrapperClassName` (string): CSS classes for header wrapper
- `headerClassName` (string): CSS classes for title and actions container

**Key Features:**

- Automatic back button and list button functionality
- Auto-generated resource titles
- Built-in breadcrumb component
- Includes `EditButton`, `ListButton`, and `RefreshButton` by default

**Basic Usage Pattern:**
Wrap content with `ShowView`, nest `ShowViewHeader` inside, and use `LoadingOverlay` for loading states around record details.

---

## Layout & Theme

### ThemedLayout Component

**Installation:**

```bash
npx shadcn@latest add https://ui.refine.dev/r/theme-provider.json
```

**Core Components:**

#### ThemeProvider

Wraps your application to enable theme management:

```jsx
<ThemeProvider defaultTheme="system" storageKey="refine-ui-theme">
	{/* App content */}
</ThemeProvider>
```

**Props:**

- `defaultTheme`: `"light" | "dark" | "system"` (default: `"system"`)
- `storageKey`: localStorage key for saving preferences (default: `"refine-ui-theme"`)
- `children`: ReactNode

#### ThemeToggle

A cycling button that rotates through light → dark → system modes:

```jsx
<ThemeToggle />
```

**Props:** `className` for custom styling

#### ThemeSelect

Dropdown menu for explicit theme selection.

**Custom Implementation:**
Use the `useTheme` hook to build custom controls:

```jsx
const { theme, setTheme } = useTheme()
setTheme('light' | 'dark' | 'system')
```

**Key Features:**

- Automatic system preference detection
- Persistent user selection via localStorage
- Three theme options: light, dark, system
- Pre-built toggle and select components
- Hook-based API for custom implementations
- Automatically saves selections and responds to OS theme changes when set to "system" mode

---

## Authentication

### SignInForm Component

**Installation:**

```bash
npx shadcn@latest add https://ui.refine.dev/r/sign-in-form.json
```

**Import:**

```typescript
import { SignInForm } from '@/components/refine-ui/form/sign-in-form'
```

**Basic Usage:**
The component renders on a dedicated login page within a centered container:

```typescript
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <div className={cn("flex", "items-center", "justify-center", "h-screen", "w-screen")}>
      <SignInForm />
    </div>
  );
}
```

**Key Features:**

- **Built-in Authentication**: Integrates with Refine's `useLogin` hook
- **Form Fields**: Includes email and password inputs with client-side validation
- **Provider Dependency**: Requires a configured `authProvider` with a `login` method
- **Social Login Ready**: Can be extended for additional authentication methods

**Required AuthProvider Setup:**
Implement a `login` method in your authentication provider:

```typescript
const authProvider: AuthProvider = {
	login: async ({ email, password }) => {
		const response = await fetch('/api/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		})
		return response.ok
			? { success: true }
			: { success: false, error: new Error('Invalid credentials') }
	}
}
```

---

## Buttons

**Installation:**

```bash
npx shadcn@latest add https://ui.refine.dev/r/buttons.json
```

### CreateButton

**Import:**

```typescript
import { CreateButton } from '@/components/refine-ui/buttons/create'
```

**Purpose:** Uses shadcn/ui's Button component and the `create` method from `useNavigation` to navigate to resource creation pages.

**Key Props:**

- `resource`: Target resource name (defaults to inferred route resource)
- `meta`: Additional parameters for the create navigation method
- `hideText`: Boolean to display icon-only mode
- `accessControl`: Controls authorization behavior with `enabled` and `hideIfUnauthorized` options
- `children`: Custom button text (default: "Create")
- Accepts all standard shadcn/ui Button props (variant, size, className, onClick)

**Example:**

```typescript
<CreateButton resource="posts" hideText={false} />
```

### Available Button Components

All components share similar prop structures with `resource`, `meta`, `hideText`, `accessControl`, and `children` properties for consistent behavior:

- **EditButton** - Navigate to edit page
- **DeleteButton** - Remove resources
- **ShowButton** - Display resource details
- **ListButton** - Return to list view
- **RefreshButton** - Reload data
- **CloneButton** - Duplicate resources

---

## Forms

### Overview

Refine provides seamless form integration combining `@refinedev/react-hook-form`, shadcn/ui components, and Zod validation. The system automatically manages CRUD operations through your data provider.

**Installation:**

```bash
npm install @refinedev/react-hook-form @hookform/resolvers zod
npx shadcn@latest add form input button select textarea
```

### The useForm Hook

The `useForm` hook bridges React Hook Form, Refine Core, shadcn/ui, and Zod. It provides:

- Automatic form state management
- Built-in loading states during API calls
- Error handling with validation feedback
- Data fetching for edit operations
- Cache invalidation post-submission

### Schema Definition (Zod)

```typescript
import * as z from 'zod'

const postSchema = z.object({
	title: z.string().min(2, 'Title must be at least 2 characters'),
	content: z.string().min(10, 'Content must be at least 10 characters'),
	status: z.enum(['draft', 'published', 'rejected'])
})

type PostFormData = z.infer<typeof postSchema>
```

### Create Form Pattern

```typescript
const {
	refineCore: { onFinish, formLoading },
	...form
} = useForm<PostFormData>({
	resolver: zodResolver(postSchema),
	defaultValues: { title: '', content: '', status: 'draft' },
	refineCoreProps: { resource: 'posts', action: 'create' }
})
```

Key features: `onFinish` automatically invokes your data provider's create method; `formLoading` tracks submission state.

### Edit Form Pattern

```typescript
const { id } = useParams()
const {
	refineCore: { onFinish, formLoading, query },
	...form
} = useForm<PostFormData>({
	resolver: zodResolver(postSchema),
	refineCoreProps: { resource: 'posts', action: 'edit', id }
})
```

The `query` object contains loading state and automatically fetches existing record data.

### Field Components

Use shadcn/ui's FormField wrapper:

```typescript
<FormField
  control={form.control}
  name="title"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Title</FormLabel>
      <FormControl>
        <Input placeholder="Enter post title" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Handling Relationships

Combine `useForm` with `useSelect` for related data:

```typescript
const { options: categoryOptions } = useSelect({
	resource: 'categories',
	optionValue: 'id',
	optionLabel: 'title'
})
```

Use Popover/Command components from shadcn/ui to display relationship selectors.

### Advanced Validation

**Cross-field validation example:**

```typescript
const userSchema = z
	.object({
		password: z.string().min(8),
		confirmPassword: z.string()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword']
	})
```

**Conditional validation:** Use `refine()` to apply rules based on other field values.

### Integration Points

Forms work within Refine's view components (`CreateView`, `EditView`) and automatically:

- Submit to backend via data providers
- Handle loading/error states
- Invalidate caches after successful operations
- Display validation errors per field

---

## Data Table

### Installation

```bash
npx shadcn@latest add https://ui.refine.dev/r/data-table.json
```

This command installs the main component plus filtering, sorting, and pagination utilities, including dependencies like `@tanstack/react-table` and `react-day-picker`.

### Core Components

The DataTable system comprises several focused modules:

- **DataTable**: Renders the main table structure
- **DataTableSorter**: Manages column header sorting controls
- **DataTableFilter variants**: Handle different filter types (text, numeric, dropdown, date)
- **DataTablePagination**: Manages page navigation

### Key Imports

```javascript
import { DataTable } from '@/components/refine-ui/data-table/data-table'
import { DataTableSorter } from '@/components/refine-ui/data-table/data-table-sorter'
import {
	DataTableFilterDropdownText,
	DataTableFilterCombobox,
	DataTableFilterDropdownNumeric,
	DataTableFilterDropdownDateRangePicker,
	DataTableFilterDropdownDateSinglePicker
} from '@/components/refine-ui/data-table/data-table-filter'
```

### Props Reference

| Component                               | Key Props                                           |
| --------------------------------------- | --------------------------------------------------- |
| DataTable                               | `table` (TanStack Table instance)                   |
| DataTableSorter                         | `column` (Column instance)                          |
| DataTableFilterDropdownText             | `column`, `table`, `defaultOperator`, `placeholder` |
| DataTableFilterCombobox                 | `column`, `options`, `defaultOperator`, `multiple`  |
| DataTableFilterDropdownNumeric          | `column`, `table`, `defaultOperator`, `placeholder` |
| DataTableFilterDropdownDateRangePicker  | `column`, `defaultOperator`, `formatDateRange`      |
| DataTableFilterDropdownDateSinglePicker | `column`, `defaultOperator`, `formatDate`           |

### Column Definition Pattern

Columns use TanStack Table's `ColumnDef<T>[]` structure:

```javascript
{
  id: "fieldName",
  accessorKey: "fieldName",
  header: ({ column, table }) => (
    <div className="flex items-center gap-1">
      <span>Label</span>
      <DataTableSorter column={column} />
    </div>
  ),
  cell: ({ getValue }) => getValue(),
}
```

### Hook Integration

Use `useTable` from `@refinedev/react-table`:

```javascript
const table =
	useTable <
	DataType >
	{
		columns,
		refineCoreProps: {
			resource: 'resourceName'
		}
	}
```

### Primary Features

**Sorting:** Click column headers; sorting parameters automatically transmit to your data provider.

**Filtering:** Supports text searches, numeric ranges, dropdown selections, and date ranges via dedicated filter components.

**Actions:** Implement row-level operations using dropdown menus with edit/delete/show buttons.

**Relational Data:** Employ `useMany` hook to fetch associated resource details; populate table `meta` object via `setOptions` for column access.

---

## Notifications

### NotificationProvider

**Installation:**

```bash
npx shadcn@latest add https://ui.refine.dev/r/notification-provider.json
```

**Setup Configuration:**
Configure at your application root:

```typescript
import { Refine } from "@refinedev/core";
import { useNotificationProvider } from "@/components/refine-ui/notification/use-notification-provider";
import { Toaster } from "@/components/refine-ui/notification/toaster";

function App() {
  return (
    <>
      <Refine
        notificationProvider={useNotificationProvider}
      >
        {/* App content */}
      </Refine>
      <Toaster />
    </>
  );
}
```

**Key Features:**

**Automatic Operations:** The system displays feedback for data create, update, and delete operations without requiring manual configuration.

**Manual Triggering:** Use the `useNotification` hook to programmatically trigger notifications:

- Success notifications
- Error notifications
- Progress notifications

**Undo Functionality:** Display progress-type notifications with `undoableTimeout` property to enable users to reverse actions within a specified timeframe.

### Core API Components

| Component                 | Purpose                                           |
| ------------------------- | ------------------------------------------------- |
| `useNotificationProvider` | Returns notification functions for Refine context |
| `Toaster`                 | Container displaying notifications on screen      |

### Notification Configuration Options

| Option            | Type                   | Details                                       |
| ----------------- | ---------------------- | --------------------------------------------- |
| `type`            | success/error/progress | Notification category                         |
| `message`         | string                 | Primary notification text                     |
| `description`     | string                 | Supporting details                            |
| `undoableTimeout` | number                 | Duration (seconds) for undo button visibility |
| `cancelMutation`  | function               | Executes when user clicks undo                |

### Toaster Props

- **position**: Placement on screen (default: top-right)
- **theme**: Visual style (light/dark/system)

---

## Sources

- [Refine shadcn/ui Introduction](https://refine.dev/docs/ui-integrations/shadcn/introduction/)
- [Building a CRUD app with Shadcn UI and Refine](https://refine.dev/blog/shadcn-ui/)
- [CreateView Documentation](https://refine.dev/docs/ui-integrations/shadcn/components/basic-views/create/)
- [EditView Documentation](https://refine.dev/docs/ui-integrations/shadcn/components/basic-views/edit/)
- [ListView Documentation](https://refine.dev/docs/ui-integrations/shadcn/components/basic-views/list/)
- [ShowView Documentation](https://refine.dev/docs/ui-integrations/shadcn/components/basic-views/show/)
- [ThemedLayout Documentation](https://refine.dev/docs/ui-integrations/shadcn/components/themed-layout/)
- [SignInForm Documentation](https://refine.dev/docs/ui-integrations/shadcn/components/sign-in-form/)
- [Button Components Documentation](https://refine.dev/docs/ui-integrations/shadcn/components/buttons/create-button/)
- [Forms Documentation](https://refine.dev/docs/ui-integrations/shadcn/components/forms/)
- [DataTable Documentation](https://refine.dev/docs/ui-integrations/shadcn/components/data-table/)
- [NotificationProvider Documentation](https://refine.dev/docs/ui-integrations/shadcn/components/notification-provider/)
