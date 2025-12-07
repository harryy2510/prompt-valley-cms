# Generic Resource Configuration Plan

This document outlines the comprehensive plan to migrate from hardcoded resource definitions to a fully generic, configuration-driven approach.

## Current State

- Resources defined manually in individual page components
- Relationships (manyToMany) passed via `meta.relations` in list components
- Data provider reads relations from meta and handles junction table queries generically
- Forms, tables, and views built per-resource with significant code duplication

## Goal

Single JSON/TypeScript configuration per resource that drives:
- Data provider behavior (relationships, select queries)
- Table column definitions and filters
- Form field definitions and validation
- Show view layouts
- Export/Import configurations
- Route generation

---

## Field Types

Based on current codebase usage:

| Type | Component | Example Usage |
|------|-----------|---------------|
| `string` | `<Input type="text">` | title, name |
| `text` | `<Textarea>` | description |
| `richtext` | `<Textarea rows={8}>` | prompt content |
| `number` | `<Input type="number">` | context_window, cost |
| `boolean` | `<Switch>` | is_published, is_featured |
| `enum` | `<Select>` | tier (free/pro) |
| `enumMulti` | `<MultiSelect>` | capabilities (text/image/video/code) |
| `date` | `<Calendar mode="single">` | single date |
| `dateRange` | `<Calendar mode="range">` | date range filter |
| `datetime` | formatted display | created_at, updated_at |
| `uuid` | hidden or display only | id |
| `slug` | `<SlugField>` | custom ID with validation |
| `image` | `<ImageUpload>` | logo_url |
| `images` | `<ImagesUpload>` | images array |
| `url` | `<Input>` + external link | website_url |
| `json` | custom | capabilities array in DB |

---

## Relation Types

### belongsTo (Many-to-One)
Direct foreign key on the table.

```typescript
{
  type: 'belongsTo',
  resource: 'categories',
  foreignKey: 'category_id',      // column on this table
  labelField: 'name',             // field to display
  // Optional: filter options for select
  filters: [
    { field: 'parent_id', operator: 'null', value: true }
  ],
  // Optional: exclude current record in edit mode
  excludeSelf: true
}
```

**Used in:**
- `prompts.category_id` -> `categories`
- `ai_models.provider_id` -> `ai_providers`
- `categories.parent_id` -> `categories` (self-referential)

### hasMany (One-to-Many)
Foreign key on the related table pointing here.

```typescript
{
  type: 'hasMany',
  resource: 'ai_models',
  foreignKey: 'provider_id',      // column on related table
  labelField: 'name',
  countField: 'models_count'      // virtual field for count display
}
```

**Used in:**
- `ai_providers` -> `ai_models` (show count in list)
- `tags` -> `prompt_tags` (show prompts count)

### manyToMany
Junction table relationship.

```typescript
{
  type: 'manyToMany',
  resource: 'tags',
  through: 'prompt_tags',         // junction table
  foreignKey: 'prompt_id',        // FK to this resource
  relatedKey: 'tag_id',           // FK to related resource
  labelField: 'name'
}
```

**Used in:**
- `prompts` <-> `tags` via `prompt_tags`
- `prompts` <-> `ai_models` via `prompt_models`

---

## Relation Display & Data Fetching

### Displaying Related Data in Lists

When showing a `belongsTo` field in a table, we need to display the related record's label (e.g., "Marketing") not just the foreign key (e.g., "abc-123").

```typescript
interface BelongsToRelation {
  type: 'belongsTo'
  resource: string
  foreignKey: string
  labelField: string              // Field to display (e.g., 'name')

  // Additional display fields to fetch
  displayFields?: string[]        // e.g., ['name', 'icon', 'color']

  // For nested access in templates
  accessor?: string               // e.g., 'category.name' for nested display
}
```

**Generated Select Query:**
```typescript
// For prompts with category relation:
// Config: { type: 'belongsTo', resource: 'categories', foreignKey: 'category_id', labelField: 'name' }
// Generated: '*, categories(id, name)'

// With additional display fields:
// Config: { displayFields: ['name', 'icon', 'color'] }
// Generated: '*, categories(id, name, icon, color)'
```

### Displaying ManyToMany in Lists

For junction table relationships, we need to:
1. Fetch through the junction table
2. Access nested data for display

```typescript
interface ManyToManyRelation {
  type: 'manyToMany'
  resource: string               // e.g., 'tags'
  through: string                // e.g., 'prompt_tags'
  foreignKey: string             // e.g., 'prompt_id'
  relatedKey: string             // e.g., 'tag_id'
  labelField: string             // e.g., 'name'

  // Additional fields to fetch from related resource
  displayFields?: string[]       // e.g., ['name', 'color']

  // Accessor path for nested data
  // Auto-generated: '{through}({resource}(id, {labelField}))'
  accessor?: string              // e.g., 'prompt_tags.tags.name'
}
```

**Generated Select Query:**
```typescript
// For prompts with tags relation:
// Config: { type: 'manyToMany', resource: 'tags', through: 'prompt_tags', relatedKey: 'tag_id', labelField: 'name' }
// Generated: 'prompt_tags(tags(id, name))'

// Full select for prompts:
// '*, categories(id, name), prompt_tags(tags(id, name)), prompt_models(ai_models(id, name))'
```

### Select Query Generation Utility

```typescript
// src/config/utils/generate-select.ts

function generateSelectQuery(config: ResourceConfig): string {
  const parts: string[] = ['*']

  for (const [name, relation] of Object.entries(config.relations || {})) {
    const fields = ['id', relation.labelField, ...(relation.displayFields || [])]
    const fieldList = [...new Set(fields)].join(', ')

    if (relation.type === 'belongsTo') {
      // Direct relation: categories(id, name)
      parts.push(`${relation.resource}(${fieldList})`)
    }
    else if (relation.type === 'manyToMany') {
      // Junction table: prompt_tags(tags(id, name))
      parts.push(`${relation.through}(${relation.resource}(${fieldList}))`)
    }
    // hasMany doesn't need to be in select - it's counted or loaded separately
  }

  return parts.join(', ')
}

// Example output:
// generateSelectQuery(promptsConfig)
// => '*, categories(id, name), prompt_tags(tags(id, name)), prompt_models(ai_models(id, name))'
```

### Accessing Nested Data in Cells

```typescript
interface ListColumnConfig {
  id: string

  // For relation fields - path to display value
  // Auto-generated from relation config if not specified
  accessor?: string | ((row: unknown) => unknown)

  // Examples:
  // 'category_id' with belongsTo -> accessor: 'categories.name' (auto)
  // 'tags' with manyToMany -> accessor: (row) => row.prompt_tags?.map(pt => pt.tags?.name)
}

// Cell renderer receives the accessed value
list: {
  columns: [
    {
      id: 'category_id',
      cell: 'default',
      // Auto-generated accessor from relation:
      // accessor: (row) => row.categories?.name
    },
    {
      id: 'tags',
      cell: 'tags',
      // Auto-generated accessor from relation:
      // accessor: (row) => row.prompt_tags?.map(pt => pt.tags)
    }
  ]
}
```

### Form Options Loading (useSelect)

For relation fields in forms, we need to load options from the related resource.

```typescript
interface BelongsToRelation {
  // ... existing fields

  // Options loading configuration
  optionLabel?: string           // Field for option label (default: labelField)
  optionValue?: string           // Field for option value (default: 'id')

  // Pagination for large datasets
  pagination?: {
    pageSize?: number            // default: 1000
    mode?: 'client' | 'server'
  }

  // Search/filter options
  searchable?: boolean           // Enable search in select
  searchFields?: string[]        // Fields to search in

  // Sort options
  sortBy?: string                // Field to sort by
  sortOrder?: 'asc' | 'desc'
}
```

**Generated useSelect config:**
```typescript
// From relation config:
// { type: 'belongsTo', resource: 'categories', labelField: 'name', filters: [...] }

// Generated useSelect call:
const { options } = useSelect({
  resource: 'categories',
  optionLabel: 'name',
  optionValue: 'id',
  filters: [...],
  pagination: { pageSize: 1000 }
})
```

### Form Relation Data Preloading

For manyToMany fields in edit mode, we need to preload existing junction table data.

```typescript
interface ManyToManyRelation {
  // ... existing fields

  // Form field configuration
  formField?: string             // Name of form field (default: relation name)

  // Preload configuration for edit mode
  preload?: {
    // Query to load existing relations
    // Auto-generated: SELECT {relatedKey} FROM {through} WHERE {foreignKey} = :id
    select?: string
  }
}
```

**Generated preload query:**
```typescript
// For tags relation on prompt edit:
// Config: { through: 'prompt_tags', foreignKey: 'prompt_id', relatedKey: 'tag_id' }

// Generated query using getRelatedServer:
const { data: tagsData } = await getRelatedServer({
  data: {
    junctionTable: 'prompt_tags',
    fkColumn: 'prompt_id',
    fkValue: id,
    select: 'tag_id'
  }
})

// Set form value:
form.setValue('tags', tagsData.map(t => t.tag_id))
```

### Show View Relation Display

```typescript
interface ShowConfig {
  sections: ShowSectionConfig[]

  // Relation display in show view
  relations?: Record<string, {
    // Display mode
    display: 'inline' | 'list' | 'table' | 'cards'

    // Fields to show from related records
    fields?: string[]

    // For table/cards display
    columns?: ListColumnConfig[]

    // Link to related resource list
    linkToList?: boolean

    // Max items to show (for list/inline)
    limit?: number

    // Show "View all" link
    showViewAll?: boolean
  }>
}

// Example
show: {
  relations: {
    tags: {
      display: 'inline',           // Show as inline badges
      fields: ['name']
    },
    models: {
      display: 'list',             // Show as vertical list
      fields: ['name', 'provider.name'],
      limit: 5,
      showViewAll: true,
      linkToList: true
    }
  }
}
```

---

## Complete Configuration Schema

```typescript
// src/config/types.ts

type FieldType =
  | 'string' | 'text' | 'richtext' | 'number' | 'boolean'
  | 'enum' | 'enumMulti' | 'date' | 'dateRange' | 'datetime'
  | 'uuid' | 'slug' | 'image' | 'images' | 'url' | 'json'

type FilterOperator =
  | 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte'
  | 'contains' | 'startswith' | 'endswith'
  | 'in' | 'nin' | 'null' | 'nnull' | 'between'

type RelationType = 'belongsTo' | 'hasMany' | 'manyToMany'

interface FieldConfig {
  type: FieldType

  // Display
  label?: string
  placeholder?: string
  description?: string

  // Validation
  required?: boolean
  nullable?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  step?: number                    // for number inputs
  pattern?: string                 // regex pattern

  // Behavior
  default?: unknown
  readonly?: boolean               // can't edit after creation
  hidden?: boolean                 // never show in UI
  computed?: boolean               // calculated field, not stored

  // List table
  sortable?: boolean
  filterable?: boolean
  filterOperators?: FilterOperator[]
  columnWidth?: number
  columnHidden?: boolean           // hidden by default in column visibility

  // Export/Import
  exportable?: boolean
  importable?: boolean
  exportHeader?: string            // custom header name for export

  // Type-specific options
  options?: Array<{ label: string; value: string }>  // for enum/enumMulti
  enumValues?: string[]            // shorthand for simple enums

  // Slug field specific
  sourceField?: string             // auto-generate from this field

  // Image field specific
  folder?: string                  // storage folder path
  accept?: string                  // file types

  // Number field specific
  currency?: boolean               // show as currency
  currencySymbol?: string

  // Relation reference
  relation?: string                // name of relation to use
}

interface BelongsToRelation {
  type: 'belongsTo'
  resource: string
  foreignKey: string
  labelField: string
  filters?: Array<{
    field: string
    operator: FilterOperator
    value: unknown
  }>
  excludeSelf?: boolean
}

interface HasManyRelation {
  type: 'hasMany'
  resource: string
  foreignKey: string
  labelField: string
  countField?: string
}

interface ManyToManyRelation {
  type: 'manyToMany'
  resource: string
  through: string
  foreignKey: string
  relatedKey: string
  labelField: string
}

type RelationConfig = BelongsToRelation | HasManyRelation | ManyToManyRelation

interface ListColumnConfig {
  id: string
  // Cell rendering
  cell?: 'default' | 'badge' | 'switch' | 'date' | 'datetime' | 'link' | 'image' | 'tags' | 'count'
  // For badge cell
  badgeVariant?: (value: unknown) => 'default' | 'secondary' | 'outline' | 'destructive'
  // For link cell
  linkTo?: string | ((row: unknown) => string)
  // For switch cell - enable inline editing
  inlineEdit?: boolean
  // For count cell - link to filtered list
  countLinkTo?: string
  countLinkFilter?: { field: string; operator: string }
  // Custom cell renderer (escape hatch)
  render?: string  // name of custom component
}

interface ListFilterConfig {
  field: string
  type: 'combobox' | 'text' | 'number' | 'date' | 'dateRange' | 'boolean'
  operators?: FilterOperator[]
  // For combobox - options source
  optionsFrom?: string  // relation name or field name for enum
  multiple?: boolean
}

interface ListConfig {
  // Columns to display
  columns: Array<string | ListColumnConfig>

  // Column visibility storage key
  visibilityStorageKey?: string

  // Default hidden columns
  defaultHiddenColumns?: string[]

  // Sorting
  defaultSort?: { field: string; order: 'asc' | 'desc' }
  enableMultiSort?: boolean

  // Filters
  filters?: ListFilterConfig[]

  // Search
  searchFields?: string[]

  // Pagination
  defaultPageSize?: number
  pageSizeOptions?: number[]

  // Row actions
  actions?: {
    view?: boolean
    edit?: boolean
    delete?: boolean
    custom?: Array<{
      label: string
      icon?: string
      onClick?: string  // action name
      variant?: 'default' | 'destructive'
    }>
  }

  // Context menu
  contextMenu?: boolean

  // Bulk actions
  bulkActions?: Array<{
    label: string
    action: string
    confirmMessage?: string
  }>
}

interface ExportConfig {
  enabled?: boolean
  filename?: string
  columns: Array<{
    key: string
    header: string
    example?: string
  }>
  // For relations - transform function name
  transform?: string
  // Select query for fetching all data
  select?: string
}

interface ImportConfig {
  enabled?: boolean
  templateFilename?: string
  // Fields to exclude from main record
  excludeFields?: string[]
  // Relationship handling
  relationships?: Array<{
    field: string
    resource: string
    isMany?: boolean
    junctionTable?: string
    junctionFk?: string
    junctionRelatedFk?: string
  }>
  // Transform before insert
  transform?: string
}

interface FormSectionConfig {
  title: string
  description?: string
  fields: string[]
  columns?: 1 | 2 | 3 | 4  // grid columns
  collapsible?: boolean
  defaultCollapsed?: boolean
}

interface FormFieldConfig {
  // Override field config for form
  hidden?: boolean | ((mode: 'create' | 'edit') => boolean)
  disabled?: boolean | ((mode: 'create' | 'edit') => boolean)
  // Grid span in section
  colSpan?: 1 | 2 | 3 | 4
  // Custom component
  component?: string
}

interface FormConfig {
  sections: FormSectionConfig[]

  // Per-field overrides
  fields?: Record<string, FormFieldConfig>

  // After submit
  redirect?: 'list' | 'show' | 'edit' | 'stay'

  // Unsaved changes warning
  warnUnsavedChanges?: boolean

  // Validation mode
  validateOnBlur?: boolean
  validateOnChange?: boolean
}

interface ShowSectionConfig {
  title: string
  description?: string
  fields: string[]
  columns?: 1 | 2 | 3 | 4
}

interface ShowConfig {
  sections: ShowSectionConfig[]

  // Header actions
  actions?: Array<{
    label: string
    icon?: string
    field?: string        // for toggle actions
    toggleLabels?: { on: string; off: string }
    variant?: 'default' | 'outline' | 'destructive'
  }>
}

interface ResourceConfig {
  // Database
  table: string
  primaryKey?: string           // default: 'id'

  // Display
  singularName?: string         // e.g., "Prompt"
  pluralName?: string           // e.g., "Prompts"
  labelField?: string           // field used for display labels
  icon?: string                 // lucide icon name

  // Fields
  fields: Record<string, FieldConfig>

  // Relations
  relations?: Record<string, RelationConfig>

  // Views
  list?: ListConfig
  form?: FormConfig
  show?: ShowConfig

  // Export/Import
  export?: ExportConfig
  import?: ImportConfig

  // Access control
  permissions?: {
    list?: string[]             // role names
    create?: string[]
    edit?: string[]
    delete?: string[]
    show?: string[]
  }

  // Audit
  timestamps?: boolean          // has created_at, updated_at
  softDelete?: boolean          // has deleted_at
}
```

---

## Example: Full Prompts Configuration

```typescript
// src/config/resources/prompts.ts

export const promptsConfig: ResourceConfig = {
  table: 'prompts',
  primaryKey: 'id',
  singularName: 'Prompt',
  pluralName: 'Prompts',
  labelField: 'title',
  icon: 'FileText',
  timestamps: true,

  fields: {
    id: {
      type: 'slug',
      label: 'Prompt ID',
      required: true,
      sourceField: 'title',
      readonly: true,  // can't change after creation
      placeholder: 'e.g. write-product-description'
    },
    title: {
      type: 'string',
      label: 'Title',
      required: true,
      minLength: 1,
      sortable: true,
      placeholder: 'Write a compelling product description'
    },
    description: {
      type: 'text',
      label: 'Description',
      nullable: true,
      placeholder: 'Brief description of what this prompt does'
    },
    content: {
      type: 'richtext',
      label: 'Prompt Content',
      required: true,
      placeholder: 'Enter the full prompt content here...'
    },
    category_id: {
      type: 'uuid',
      label: 'Category',
      required: true,
      relation: 'category',
      sortable: true,
      filterable: true
    },
    tier: {
      type: 'enum',
      label: 'Tier',
      required: true,
      default: 'free',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Pro', value: 'pro' }
      ],
      sortable: true,
      filterable: true
    },
    is_published: {
      type: 'boolean',
      label: 'Published',
      default: false,
      sortable: true,
      filterable: true
    },
    is_featured: {
      type: 'boolean',
      label: 'Featured',
      default: false,
      sortable: true
    },
    images: {
      type: 'images',
      label: 'Images',
      folder: 'images/prompts',
      default: []
    },
    views_count: {
      type: 'number',
      label: 'Views',
      readonly: true,
      computed: true,
      default: 0,
      sortable: true
    },
    created_at: {
      type: 'datetime',
      label: 'Created',
      readonly: true,
      sortable: true
    },
    updated_at: {
      type: 'datetime',
      label: 'Updated',
      readonly: true,
      sortable: true
    }
  },

  relations: {
    category: {
      type: 'belongsTo',
      resource: 'categories',
      foreignKey: 'category_id',
      labelField: 'name'
    },
    tags: {
      type: 'manyToMany',
      resource: 'tags',
      through: 'prompt_tags',
      foreignKey: 'prompt_id',
      relatedKey: 'tag_id',
      labelField: 'name'
    },
    models: {
      type: 'manyToMany',
      resource: 'ai_models',
      through: 'prompt_models',
      foreignKey: 'prompt_id',
      relatedKey: 'model_id',
      labelField: 'name'
    }
  },

  list: {
    columns: [
      'title',
      { id: 'category_id', cell: 'default' },
      { id: 'tags', cell: 'tags' },
      { id: 'models', cell: 'tags' },
      { id: 'tier', cell: 'badge', badgeVariant: (v) => v === 'pro' ? 'default' : 'secondary' },
      { id: 'is_published', cell: 'switch', inlineEdit: true },
      { id: 'is_featured', cell: 'switch', inlineEdit: true },
      { id: 'views_count', cell: 'default' },
      { id: 'created_at', cell: 'date' },
      { id: 'updated_at', cell: 'date' }
    ],
    visibilityStorageKey: 'prompts-column-visibility',
    defaultSort: { field: 'created_at', order: 'desc' },
    filters: [
      { field: 'category_id', type: 'combobox', optionsFrom: 'category' },
      { field: 'tag_id', type: 'combobox', optionsFrom: 'tags' },
      { field: 'model_id', type: 'combobox', optionsFrom: 'models' },
      { field: 'tier', type: 'combobox', optionsFrom: 'tier' },
      { field: 'is_published', type: 'combobox', optionsFrom: 'is_published' }
    ],
    actions: { view: true, edit: true, delete: true }
  },

  form: {
    sections: [
      {
        title: 'Prompt Details',
        description: 'Enter the information for the prompt',
        fields: ['title', 'id', 'description', 'content']
      },
      {
        title: 'Content Settings',
        description: 'Configure category, tier, and publishing settings',
        fields: ['category_id', 'tier'],
        columns: 2
      },
      {
        title: 'Relationships',
        description: 'Associate tags and compatible models with this prompt',
        fields: ['tags', 'models']
      },
      {
        title: 'Images',
        description: 'Add images to illustrate the prompt',
        fields: ['images']
      }
    ],
    fields: {
      id: {
        disabled: (mode) => mode === 'edit'
      }
    },
    redirect: 'list',
    warnUnsavedChanges: true
  },

  show: {
    sections: [
      {
        title: 'Prompt Content',
        fields: ['content', 'images']
      },
      {
        title: 'Status & Classification',
        description: 'Current publication and tier status',
        fields: ['is_published', 'is_featured', 'tier', 'category_id', 'views_count'],
        columns: 4
      },
      {
        title: 'Tags',
        fields: ['tags']
      },
      {
        title: 'Compatible Models',
        fields: ['models']
      }
    ],
    actions: [
      {
        label: 'Published',
        icon: 'Eye',
        field: 'is_published',
        toggleLabels: { on: 'Published', off: 'Draft' }
      },
      {
        label: 'Featured',
        icon: 'Star',
        field: 'is_featured',
        toggleLabels: { on: 'Featured', off: 'Not Featured' }
      }
    ]
  },

  export: {
    enabled: true,
    filename: 'prompts',
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'title', header: 'Title' },
      { key: 'description', header: 'Description' },
      { key: 'content', header: 'Content' },
      { key: 'category_id', header: 'Category ID' },
      { key: 'tier', header: 'Tier' },
      { key: 'is_published', header: 'Published' },
      { key: 'is_featured', header: 'Featured' },
      { key: 'tag_ids', header: 'Tag IDs' },
      { key: 'model_ids', header: 'Model IDs' },
      { key: 'created_at', header: 'Created At' }
    ],
    select: '*, categories(id, name), prompt_tags(tags(id, name)), prompt_models(ai_models(id, name))',
    transform: 'transformPromptsForExport'
  },

  import: {
    enabled: true,
    templateFilename: 'prompts-template',
    excludeFields: ['created_at'],
    relationships: [
      {
        field: 'tag_ids',
        resource: 'tags',
        isMany: true,
        junctionTable: 'prompt_tags',
        junctionFk: 'prompt_id',
        junctionRelatedFk: 'tag_id'
      },
      {
        field: 'model_ids',
        resource: 'ai_models',
        isMany: true,
        junctionTable: 'prompt_models',
        junctionFk: 'prompt_id',
        junctionRelatedFk: 'model_id'
      },
      {
        field: 'category_id',
        resource: 'categories'
      }
    ]
  }
}
```

---

## Example: Simple Tags Configuration

```typescript
// src/config/resources/tags.ts

export const tagsConfig: ResourceConfig = {
  table: 'tags',
  singularName: 'Tag',
  pluralName: 'Tags',
  labelField: 'name',
  icon: 'Tag',
  timestamps: true,

  fields: {
    id: {
      type: 'slug',
      label: 'Tag ID',
      required: true,
      sourceField: 'name'
    },
    name: {
      type: 'string',
      label: 'Name',
      required: true,
      minLength: 1,
      sortable: true
    },
    prompts_count: {
      type: 'number',
      label: 'Prompts',
      computed: true,
      readonly: true
    },
    created_at: {
      type: 'datetime',
      label: 'Created',
      sortable: true
    },
    updated_at: {
      type: 'datetime',
      label: 'Updated',
      sortable: true
    }
  },

  relations: {
    prompts: {
      type: 'hasMany',
      resource: 'prompts',
      foreignKey: 'tag_id',  // via junction
      labelField: 'title',
      countField: 'prompts_count'
    }
  },

  list: {
    columns: [
      'name',
      {
        id: 'prompts_count',
        cell: 'count',
        countLinkTo: '/prompts',
        countLinkFilter: { field: 'tag_id', operator: 'eq' }
      },
      { id: 'created_at', cell: 'date' },
      { id: 'updated_at', cell: 'date' }
    ],
    visibilityStorageKey: 'tags-column-visibility',
    defaultSort: { field: 'created_at', order: 'desc' }
  },

  form: {
    sections: [
      {
        title: 'Tag Information',
        fields: ['name', 'id']
      }
    ],
    redirect: 'list'
  },

  export: {
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'created_at', header: 'Created At' }
    ]
  },

  import: {
    templateFilename: 'tags-template',
    excludeFields: ['created_at']
  }
}
```

---

## Example: AI Providers Configuration

```typescript
// src/config/resources/ai-providers.ts

export const aiProvidersConfig: ResourceConfig = {
  table: 'ai_providers',
  singularName: 'AI Provider',
  pluralName: 'AI Providers',
  labelField: 'name',
  icon: 'Building2',
  timestamps: true,

  fields: {
    id: {
      type: 'slug',
      label: 'Provider ID',
      required: true,
      sourceField: 'name',
      readonly: true
    },
    name: {
      type: 'string',
      label: 'Provider Name',
      required: true,
      minLength: 1,
      sortable: true,
      placeholder: 'e.g. OpenAI, Anthropic, Google'
    },
    logo_url: {
      type: 'image',
      label: 'Provider Logo',
      folder: 'ai-providers',
      nullable: true
    },
    website_url: {
      type: 'url',
      label: 'Website URL',
      nullable: true,
      placeholder: 'https://example.com'
    },
    models_count: {
      type: 'number',
      label: 'Models',
      computed: true,
      readonly: true
    },
    created_at: { type: 'datetime', label: 'Created', sortable: true },
    updated_at: { type: 'datetime', label: 'Updated', sortable: true }
  },

  relations: {
    models: {
      type: 'hasMany',
      resource: 'ai_models',
      foreignKey: 'provider_id',
      labelField: 'name',
      countField: 'models_count'
    }
  },

  list: {
    columns: [
      { id: 'logo_url', cell: 'image' },
      'name',
      {
        id: 'models_count',
        cell: 'count',
        countLinkTo: '/ai-models',
        countLinkFilter: { field: 'provider_id', operator: 'eq' }
      },
      { id: 'website_url', cell: 'link' },
      { id: 'created_at', cell: 'date' },
      { id: 'updated_at', cell: 'date' }
    ],
    visibilityStorageKey: 'ai-providers-column-visibility',
    defaultSort: { field: 'created_at', order: 'desc' }
  },

  form: {
    sections: [
      {
        title: 'Provider Information',
        description: 'Enter the basic information for the AI provider',
        fields: ['name', 'id']
      },
      {
        title: 'Branding & Links',
        description: 'Optional logo and website information',
        fields: ['logo_url', 'website_url']
      }
    ],
    redirect: 'list'
  },

  export: {
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'website_url', header: 'Website URL' },
      { key: 'logo_url', header: 'Logo URL' },
      { key: 'created_at', header: 'Created At' }
    ]
  },

  import: {
    templateFilename: 'ai-providers-template',
    excludeFields: ['created_at', 'logo_url']
  }
}
```

---

## Example: Categories Configuration (Self-Referential)

```typescript
// src/config/resources/categories.ts

export const categoriesConfig: ResourceConfig = {
  table: 'categories',
  singularName: 'Category',
  pluralName: 'Categories',
  labelField: 'name',
  icon: 'FolderTree',
  timestamps: true,

  fields: {
    id: {
      type: 'slug',
      label: 'Category ID',
      required: true,
      sourceField: 'name',
      readonly: true
    },
    name: {
      type: 'string',
      label: 'Category Name',
      required: true,
      minLength: 1,
      sortable: true,
      placeholder: 'e.g. Marketing, Development'
    },
    parent_id: {
      type: 'uuid',
      label: 'Parent Category',
      nullable: true,
      relation: 'parent',
      description: 'Optionally nest this category under a parent. Only one level of nesting is allowed.'
    },
    children_count: {
      type: 'number',
      label: 'Subcategories',
      computed: true,
      readonly: true
    },
    prompts_count: {
      type: 'number',
      label: 'Prompts',
      computed: true,
      readonly: true
    },
    created_at: { type: 'datetime', label: 'Created', sortable: true },
    updated_at: { type: 'datetime', label: 'Updated', sortable: true }
  },

  relations: {
    parent: {
      type: 'belongsTo',
      resource: 'categories',
      foreignKey: 'parent_id',
      labelField: 'name',
      // Only allow top-level categories as parents (no deep nesting)
      filters: [
        { field: 'parent_id', operator: 'null', value: true }
      ],
      // Exclude current category when editing (can't be own parent)
      excludeSelf: true,
      // Nullable option with "No parent" placeholder
      nullable: true,
      nullLabel: 'No parent (top-level)'
    },
    children: {
      type: 'hasMany',
      resource: 'categories',
      foreignKey: 'parent_id',
      labelField: 'name',
      countField: 'children_count'
    },
    prompts: {
      type: 'hasMany',
      resource: 'prompts',
      foreignKey: 'category_id',
      labelField: 'title',
      countField: 'prompts_count'
    }
  },

  list: {
    columns: [
      'name',
      'parent_id',
      {
        id: 'children_count',
        cell: 'count',
        countLinkTo: '/categories',
        countLinkFilter: { field: 'parent_id', operator: 'eq' }
      },
      {
        id: 'prompts_count',
        cell: 'count',
        countLinkTo: '/prompts',
        countLinkFilter: { field: 'category_id', operator: 'eq' }
      },
      { id: 'created_at', cell: 'date' }
    ],
    defaultSort: { field: 'name', order: 'asc' }
  },

  form: {
    sections: [
      {
        title: 'Category Information',
        fields: ['name', 'id', 'parent_id']
      }
    ],
    redirect: 'list'
  }
}
```

---

## Example: AI Models Configuration

```typescript
// src/config/resources/ai-models.ts

export const aiModelsConfig: ResourceConfig = {
  table: 'ai_models',
  singularName: 'AI Model',
  pluralName: 'AI Models',
  labelField: 'name',
  icon: 'Cpu',
  timestamps: true,

  fields: {
    id: {
      type: 'slug',
      label: 'Model ID',
      required: true,
      sourceField: 'name'
    },
    name: {
      type: 'string',
      label: 'Model Name',
      required: true,
      minLength: 2,
      sortable: true
    },
    provider_id: {
      type: 'uuid',
      label: 'Provider',
      required: true,
      relation: 'provider',
      sortable: true,
      filterable: true
    },
    capabilities: {
      type: 'enumMulti',
      label: 'Capabilities',
      default: [],
      options: [
        { label: 'Text', value: 'text' },
        { label: 'Image', value: 'image' },
        { label: 'Video', value: 'video' },
        { label: 'Code', value: 'code' }
      ]
    },
    context_window: {
      type: 'number',
      label: 'Context Window',
      nullable: true,
      min: 0,
      description: 'Number of tokens'
    },
    max_output_tokens: {
      type: 'number',
      label: 'Max Output Tokens',
      nullable: true,
      min: 0
    },
    cost_input_per_million: {
      type: 'number',
      label: 'Input Cost (per 1M tokens)',
      nullable: true,
      min: 0,
      step: 0.01,
      currency: true,
      description: 'USD'
    },
    cost_output_per_million: {
      type: 'number',
      label: 'Output Cost (per 1M tokens)',
      nullable: true,
      min: 0,
      step: 0.01,
      currency: true,
      description: 'USD'
    },
    created_at: { type: 'datetime', label: 'Created', sortable: true },
    updated_at: { type: 'datetime', label: 'Updated', sortable: true }
  },

  relations: {
    provider: {
      type: 'belongsTo',
      resource: 'ai_providers',
      foreignKey: 'provider_id',
      labelField: 'name'
    }
  },

  list: {
    columns: [
      'name',
      'provider_id',
      { id: 'capabilities', cell: 'tags' },
      'context_window',
      { id: 'created_at', cell: 'date' }
    ],
    defaultSort: { field: 'created_at', order: 'desc' },
    filters: [
      { field: 'provider_id', type: 'combobox', optionsFrom: 'provider' }
    ]
  },

  form: {
    sections: [
      {
        title: 'Model Information',
        fields: ['name', 'id', 'provider_id', 'capabilities']
      },
      {
        title: 'Technical Specifications',
        description: 'Optional model parameters',
        fields: ['context_window', 'max_output_tokens', 'cost_input_per_million', 'cost_output_per_million'],
        columns: 2
      }
    ],
    redirect: 'list'
  }
}
```

---

## Generated Components

### ResourceList
```tsx
<ResourceList resource="prompts" />
```
Generates:
- useTable with proper meta (select, relations)
- Column definitions from config
- Filters from config
- Export/Import buttons
- Row actions

### ResourceForm
```tsx
<ResourceForm resource="prompts" mode="create" />
<ResourceForm resource="prompts" mode="edit" id={id} />
```
Generates:
- Zod schema from field config
- useForm with validation
- Sections with fields
- Relation selects (useSelect)
- Junction table handling on submit

### ResourceShow
```tsx
<ResourceShow resource="prompts" id={id} />
```
Generates:
- useOne with proper select
- Section layouts
- Action buttons (toggles)
- Relation displays

---

## Utility Functions

### generateSelectQuery
```typescript
function generateSelectQuery(config: ResourceConfig): string
// Returns: '*, categories(id, name), prompt_tags(tags(id, name)), ...'
```

### generateZodSchema
```typescript
function generateZodSchema(config: ResourceConfig): z.ZodSchema
// Returns Zod schema for form validation
```

### generateColumnDefs
```typescript
function generateColumnDefs(config: ResourceConfig): ColumnDef[]
// Returns TanStack Table column definitions
```

### getRelationsForMeta
```typescript
function getRelationsForMeta(config: ResourceConfig): Record<string, RelationConfig>
// Returns manyToMany relations for data provider meta
```

---

## File Structure

```
src/
  config/
    types.ts                    # TypeScript types
    resources/
      index.ts                  # Export all configs
      prompts.ts
      categories.ts
      tags.ts
      ai-models.ts
      ai-providers.ts
    utils/
      generate-select.ts
      generate-schema.ts
      generate-columns.ts
  components/
    resource/
      ResourceList.tsx
      ResourceForm.tsx
      ResourceShow.tsx
      ResourceCreate.tsx        # Wrapper for create mode
      ResourceEdit.tsx          # Wrapper for edit mode
      cells/                    # Reusable cell renderers
        BadgeCell.tsx
        SwitchCell.tsx
        DateCell.tsx
        TagsCell.tsx
        CountCell.tsx
        LinkCell.tsx
        ImageCell.tsx
      fields/                   # Reusable form fields
        StringField.tsx
        TextField.tsx
        NumberField.tsx
        BooleanField.tsx
        EnumField.tsx
        EnumMultiField.tsx
        SlugField.tsx
        ImageField.tsx
        ImagesField.tsx
        RelationField.tsx       # belongsTo select
        RelationMultiField.tsx  # manyToMany multi-select
```

---

## Migration Steps

### Phase 1: Core Infrastructure (Current)
- [x] Data provider reads relations from meta
- [x] Junction table filtering is generic
- [ ] Create TypeScript types for config
- [ ] Create config loader utility

### Phase 2: Config Files
- [ ] Create prompts.ts config
- [ ] Create categories.ts config
- [ ] Create tags.ts config
- [ ] Create ai-models.ts config
- [ ] Create ai-providers.ts config

### Phase 3: Utility Functions
- [ ] generateSelectQuery
- [ ] generateZodSchema
- [ ] getRelationsForMeta

### Phase 4: Cell Renderers
- [ ] BadgeCell
- [ ] SwitchCell (with inline edit)
- [ ] DateCell
- [ ] TagsCell
- [ ] CountCell (with link)
- [ ] ImageCell

### Phase 5: Form Fields
- [ ] Generic field wrapper
- [ ] RelationField (belongsTo)
- [ ] RelationMultiField (manyToMany)
- [ ] SlugField (already exists, adapt)

### Phase 6: ResourceList
- [ ] Create ResourceList component
- [ ] Migrate tags list (simplest)
- [ ] Migrate categories list
- [ ] Migrate ai-providers list
- [ ] Migrate ai-models list
- [ ] Migrate prompts list (most complex)

### Phase 7: ResourceForm
- [ ] Create ResourceForm component
- [ ] Section rendering
- [ ] Junction table handling
- [ ] Migrate tag form
- [ ] Migrate category form
- [ ] Migrate ai-model form
- [ ] Migrate ai-provider form
- [ ] Migrate prompt form

### Phase 8: ResourceShow
- [ ] Create ResourceShow component
- [ ] Action buttons
- [ ] Migrate prompts show

### Phase 9: Route Generation
- [ ] Create route generator
- [ ] Auto-generate routes from config
- [ ] Support custom route overrides

### Phase 10: Polish
- [ ] Config validation at build time
- [ ] TypeScript type generation from config
- [ ] Documentation

---

## Custom Validation Patterns

### Built-in Validation Types

```typescript
// src/config/validations.ts

interface ValidationConfig {
  // Basic validations (built into Zod)
  required?: boolean
  nullable?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string           // regex pattern
  email?: boolean
  url?: boolean
  uuid?: boolean

  // Custom validations
  custom?: string            // name of custom validator function
}

// Custom validator registry
const customValidators = {
  // Slug: lowercase letters, numbers, hyphens
  slug: z.string()
    .min(1, 'ID is required')
    .max(100, 'ID must be 100 characters or less')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'ID must be lowercase letters, numbers, and hyphens only (e.g. "my-slug-1")'
    ),

  // Nullable non-negative number (handles empty strings from inputs)
  nullableNonNegativeNumber: z
    .union([z.string(), z.number(), z.null()])
    .transform((val): number | null => {
      if (val === '' || val === null) return null
      return typeof val === 'number' ? val : Number(val)
    })
    .refine((val) => val === null || (Number.isFinite(val) && val >= 0), {
      message: 'Must be a non-negative number'
    }),

  // Non-empty array
  nonEmptyArray: z.array(z.string()).min(1, 'At least one item is required'),

  // JSON string that parses to object/array
  jsonString: z.string()
    .refine((val) => {
      try {
        JSON.parse(val)
        return true
      } catch {
        return false
      }
    }, 'Must be valid JSON')
}
```

### Using Custom Validators in Config

```typescript
fields: {
  id: {
    type: 'slug',
    validation: { custom: 'slug' }
  },
  context_window: {
    type: 'number',
    validation: { custom: 'nullableNonNegativeNumber' }
  },
  tags: {
    type: 'array',
    validation: { custom: 'nonEmptyArray' }
  }
}
```

### Cross-Field Validation

```typescript
interface ResourceConfig {
  // ... other config
  validation?: {
    // Cross-field validation rules
    refine?: Array<{
      rule: string          // validator function name
      message: string
      fields: string[]      // fields involved
    }>
  }
}

// Example: end_date must be after start_date
validation: {
  refine: [
    {
      rule: 'dateAfter',
      message: 'End date must be after start date',
      fields: ['start_date', 'end_date']
    }
  ]
}
```

---

## Lifecycle Hooks & Callbacks

### Form Hooks

```typescript
interface FormConfig {
  hooks?: {
    // Before validation
    onBeforeValidate?: string      // function name

    // After validation, before submit
    onBeforeSubmit?: string

    // Transform data before sending to API
    transformValues?: string

    // After successful submit
    onSuccess?: string

    // After failed submit
    onError?: string

    // When form becomes dirty
    onDirty?: string
  }
}
```

### Hook Implementation Example

```typescript
// src/config/hooks/prompts.ts

export const promptFormHooks = {
  // Transform values before submit (handle junction tables)
  transformValues: async (data: PromptFormValues, { mode, id }) => {
    const { models, tags, ...promptData } = data
    return {
      mainData: promptData,
      junctionData: { models, tags }
    }
  },

  // Handle junction tables after main record is saved
  onSuccess: async ({ data, junctionData, mode, id }) => {
    const promptId = data.id

    if (mode === 'create') {
      // Insert new junction records
      if (junctionData.tags.length > 0) {
        await insertJunctionServer({
          data: {
            junctionTable: 'prompt_tags',
            records: junctionData.tags.map(tagId => ({
              prompt_id: promptId,
              tag_id: tagId
            }))
          }
        })
      }
    } else {
      // Update: delete old and insert new
      await deleteJunctionServer({
        data: { junctionTable: 'prompt_tags', column: 'prompt_id', value: promptId }
      })
      // ... insert new
    }
  }
}
```

### List Hooks

```typescript
interface ListConfig {
  hooks?: {
    // Before delete (for confirmation or validation)
    onBeforeDelete?: string

    // After successful delete
    onAfterDelete?: string

    // Transform data after fetch
    transformData?: string

    // Custom row click handler
    onRowClick?: string
  }
}
```

---

## Server Actions Configuration

### CRUD Actions

```typescript
interface ResourceConfig {
  // Server action configuration
  actions?: {
    // Use custom server functions instead of default CRUD
    getList?: string           // custom server function name
    getOne?: string
    create?: string
    update?: string
    delete?: string

    // Additional server actions
    custom?: Record<string, {
      handler: string          // server function name
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
      invalidateQueries?: string[]
    }>
  }
}
```

### Example: Custom Actions

```typescript
// config
actions: {
  custom: {
    publish: {
      handler: 'publishPrompt',
      invalidateQueries: ['prompts']
    },
    duplicate: {
      handler: 'duplicatePrompt',
      invalidateQueries: ['prompts']
    },
    bulkPublish: {
      handler: 'bulkPublishPrompts',
      invalidateQueries: ['prompts']
    }
  }
}

// Implementation: src/actions/prompts.ts
export const publishPrompt = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const client = getSupabaseServerClient()
    const { error } = await client
      .from('prompts')
      .update({ is_published: true })
      .eq('id', data.id)

    if (error) throw new Error(error.message)
    return { success: true }
  })
```

### Junction Table Actions

```typescript
interface ResourceConfig {
  // Junction table configuration for manyToMany
  junctionTables?: Record<string, {
    table: string              // e.g., 'prompt_tags'
    foreignKey: string         // e.g., 'prompt_id'
    relatedKey: string         // e.g., 'tag_id'
    relatedResource: string    // e.g., 'tags'
    formField: string          // form field name for this relation
  }>
}

// Example
junctionTables: {
  tags: {
    table: 'prompt_tags',
    foreignKey: 'prompt_id',
    relatedKey: 'tag_id',
    relatedResource: 'tags',
    formField: 'tags'
  },
  models: {
    table: 'prompt_models',
    foreignKey: 'prompt_id',
    relatedKey: 'model_id',
    relatedResource: 'ai_models',
    formField: 'models'
  }
}
```

---

## Computed Fields & Field Dependencies

### Computed Fields

```typescript
interface FieldConfig {
  // Field is computed, not stored in database
  computed?: boolean

  // How to compute the value
  compute?: {
    // From related data
    type: 'count' | 'sum' | 'avg' | 'min' | 'max'
    relation?: string          // relation name
    field?: string             // field to aggregate
  } | {
    // From function
    type: 'function'
    fn: string                 // function name
  } | {
    // From other fields (client-side)
    type: 'derived'
    from: string[]             // field names
    fn: string                 // function name
  }
}

// Examples
fields: {
  // Count from hasMany relation
  prompts_count: {
    type: 'number',
    computed: true,
    compute: { type: 'count', relation: 'prompts' }
  },

  // Full name from first + last
  full_name: {
    type: 'string',
    computed: true,
    compute: {
      type: 'derived',
      from: ['first_name', 'last_name'],
      fn: 'concatNames'
    }
  }
}
```

### Field Dependencies

```typescript
interface FieldConfig {
  // This field depends on other fields
  dependsOn?: {
    // Fields this depends on
    fields: string[]

    // Auto-update when dependencies change
    autoUpdate?: boolean

    // Update function
    updateFn?: string
  }
}

// Example: Slug auto-updates from title
fields: {
  id: {
    type: 'slug',
    dependsOn: {
      fields: ['title'],
      autoUpdate: true,
      updateFn: 'slugify'     // converts "Hello World" to "hello-world"
    }
  }
}
```

---

## Conditional Fields & Dynamic Defaults

### Conditional Field Visibility

```typescript
interface FormFieldConfig {
  // Show/hide based on other field values
  showWhen?: {
    field: string
    operator: 'eq' | 'ne' | 'in' | 'nin' | 'truthy' | 'falsy'
    value?: unknown
  } | Array<{
    field: string
    operator: string
    value?: unknown
    logic?: 'AND' | 'OR'
  }>

  // Disable based on conditions
  disableWhen?: {
    field: string
    operator: string
    value?: unknown
  }
}

// Examples
form: {
  fields: {
    // Show parent_id only when is_subcategory is true
    parent_id: {
      showWhen: { field: 'is_subcategory', operator: 'truthy' }
    },

    // Show cost fields only when tier is 'pro'
    cost: {
      showWhen: { field: 'tier', operator: 'eq', value: 'pro' }
    },

    // Complex condition: show when published AND featured
    featured_order: {
      showWhen: [
        { field: 'is_published', operator: 'truthy' },
        { field: 'is_featured', operator: 'truthy', logic: 'AND' }
      ]
    }
  }
}
```

### Dynamic Defaults

```typescript
interface FieldConfig {
  // Static default value
  default?: unknown

  // Dynamic default based on context
  dynamicDefault?: {
    type: 'currentDate' | 'currentUser' | 'uuid' | 'function'
    fn?: string              // for 'function' type
    format?: string          // for date types
  }
}

// Examples
fields: {
  created_by: {
    type: 'uuid',
    dynamicDefault: { type: 'currentUser' }
  },
  publish_date: {
    type: 'datetime',
    dynamicDefault: { type: 'currentDate' }
  },
  order: {
    type: 'number',
    dynamicDefault: { type: 'function', fn: 'getNextOrder' }
  }
}
```

---

## Inline Editing & Context Menu Actions

### Inline Table Editing

```typescript
interface ListColumnConfig {
  // Enable inline editing for this column
  inlineEdit?: boolean | {
    enabled: boolean
    // Validation for inline edit
    validate?: string        // validator function name
    // Debounce delay for auto-save (ms)
    debounce?: number
    // Show save button or auto-save
    autoSave?: boolean
  }
}

// Example: Inline switch toggle
list: {
  columns: [
    {
      id: 'is_published',
      cell: 'switch',
      inlineEdit: {
        enabled: true,
        autoSave: true
      }
    },
    {
      id: 'order',
      cell: 'number',
      inlineEdit: {
        enabled: true,
        debounce: 500,
        validate: 'positiveNumber'
      }
    }
  ]
}
```

### Context Menu Configuration

```typescript
interface ListConfig {
  // Context menu (right-click) configuration
  contextMenu?: {
    enabled?: boolean

    // Built-in actions
    actions?: {
      view?: boolean
      edit?: boolean
      delete?: boolean
      duplicate?: boolean
      copyId?: boolean
    }

    // Custom actions
    custom?: Array<{
      label: string
      icon?: string
      action: string         // action name from actions.custom
      // Keyboard shortcut
      shortcut?: string      // e.g., 'Ctrl+D'
      // Show only when condition is met
      showWhen?: (row: unknown) => boolean
      // Separator before this item
      separator?: boolean
      // Destructive action styling
      destructive?: boolean
    }>

    // Group actions into submenus
    groups?: Array<{
      label: string
      items: string[]        // action keys
    }>
  }
}

// Example
list: {
  contextMenu: {
    enabled: true,
    actions: {
      view: true,
      edit: true,
      delete: true,
      copyId: true
    },
    custom: [
      {
        label: 'Publish',
        icon: 'Eye',
        action: 'publish',
        showWhen: (row) => !row.is_published
      },
      {
        label: 'Unpublish',
        icon: 'EyeOff',
        action: 'unpublish',
        showWhen: (row) => row.is_published
      },
      { separator: true },
      {
        label: 'Duplicate',
        icon: 'Copy',
        action: 'duplicate',
        shortcut: 'Ctrl+D'
      }
    ]
  }
}
```

### Bulk Actions

```typescript
interface ListConfig {
  // Enable row selection for bulk actions
  selectable?: boolean

  // Bulk action buttons
  bulkActions?: Array<{
    label: string
    icon?: string
    action: string           // server action name
    // Confirmation dialog
    confirm?: {
      title: string
      description: string | ((count: number) => string)
      confirmLabel?: string
      cancelLabel?: string
    }
    // Destructive action styling
    destructive?: boolean
  }>
}

// Example
list: {
  selectable: true,
  bulkActions: [
    {
      label: 'Publish',
      icon: 'Eye',
      action: 'bulkPublish'
    },
    {
      label: 'Delete',
      icon: 'Trash2',
      action: 'bulkDelete',
      destructive: true,
      confirm: {
        title: 'Delete Selected',
        description: (count) => `Are you sure you want to delete ${count} items?`,
        confirmLabel: 'Delete'
      }
    }
  ]
}
```

---

## Storage & File Handling

### Storage Configuration

```typescript
interface FieldConfig {
  // For image/images/file types
  storage?: {
    // Storage bucket name
    bucket?: string          // default: 'public'

    // Folder path within bucket
    folder: string           // e.g., 'images/prompts'

    // Accepted file types
    accept?: string          // e.g., 'image/*', '.pdf,.doc'

    // Max file size in bytes
    maxSize?: number         // e.g., 5 * 1024 * 1024 (5MB)

    // Generate unique filename
    generateFilename?: 'uuid' | 'timestamp' | 'original' | string

    // Transform on upload
    transform?: {
      // Image resizing
      width?: number
      height?: number
      fit?: 'contain' | 'cover' | 'fill'
      quality?: number       // 1-100
    }
  }
}

// Examples
fields: {
  // Single image with transformation
  logo_url: {
    type: 'image',
    storage: {
      folder: 'logos',
      accept: 'image/png,image/svg+xml',
      maxSize: 2 * 1024 * 1024,
      transform: {
        width: 200,
        height: 200,
        fit: 'contain',
        quality: 90
      }
    }
  },

  // Multiple images
  images: {
    type: 'images',
    storage: {
      folder: 'images/prompts',
      accept: 'image/*',
      maxSize: 5 * 1024 * 1024,
      generateFilename: 'uuid'
    }
  },

  // PDF documents
  documents: {
    type: 'files',
    storage: {
      bucket: 'documents',
      folder: 'contracts',
      accept: '.pdf,.doc,.docx',
      maxSize: 10 * 1024 * 1024
    }
  }
}
```

### Storage URL Resolution

```typescript
// Utility function configuration
interface ResourceConfig {
  storage?: {
    // Base URL for storage
    baseUrl?: string         // default from env

    // URL transformation
    getUrl?: string          // custom function name
  }
}

// Built-in getImageUrl function handles:
// 1. Null/undefined values
// 2. Already-full URLs (https://...)
// 3. Storage paths -> full URLs
```

---

## Error Handling & Loading States

### Error Display Configuration

```typescript
interface ResourceConfig {
  errorHandling?: {
    // Error display mode
    mode: 'toast' | 'inline' | 'modal' | 'page'

    // Custom error messages
    messages?: {
      notFound?: string
      forbidden?: string
      serverError?: string
      validationError?: string
      networkError?: string
    }

    // Retry configuration
    retry?: {
      enabled: boolean
      maxAttempts?: number
      delay?: number         // ms
    }
  }
}
```

### Loading State Configuration

```typescript
interface ListConfig {
  loading?: {
    // Loading indicator type
    type: 'skeleton' | 'spinner' | 'overlay'

    // Skeleton configuration
    skeleton?: {
      rows?: number          // default: 10
      columns?: number       // auto from column config
    }
  }
}

interface FormConfig {
  loading?: {
    // Loading overlay for form
    overlay?: boolean

    // Disable fields during load
    disableFields?: boolean

    // Show skeleton for form
    skeleton?: boolean
  }
}
```

### Empty State Configuration

```typescript
interface ListConfig {
  emptyState?: {
    // Empty state title
    title?: string           // default: 'No {pluralName} found'

    // Empty state description
    description?: string

    // Show create button
    showCreateButton?: boolean

    // Custom empty state component
    component?: string       // component name

    // Different states for filtered vs unfiltered
    filtered?: {
      title?: string
      description?: string
      showClearFilters?: boolean
    }
  }
}

// Example
list: {
  emptyState: {
    title: 'No prompts yet',
    description: 'Get started by creating your first prompt.',
    showCreateButton: true,
    filtered: {
      title: 'No prompts match your filters',
      description: 'Try adjusting your search or filter criteria.',
      showClearFilters: true
    }
  }
}
```

---

## Unsaved Changes Warning

```typescript
interface FormConfig {
  // Warn when navigating away with unsaved changes
  warnUnsavedChanges?: boolean | {
    enabled: boolean

    // Custom warning message
    title?: string
    message?: string

    // Fields to track (default: all)
    watchFields?: string[]

    // Fields to ignore
    ignoreFields?: string[]
  }
}

// Example
form: {
  warnUnsavedChanges: {
    enabled: true,
    title: 'Unsaved Changes',
    message: 'You have unsaved changes. Are you sure you want to leave?',
    ignoreFields: ['updated_at']
  }
}
```

---

## Filter Configuration Details

### Junction Table Filtering

```typescript
interface ListFilterConfig {
  // For filtering through junction tables (manyToMany)
  junction?: {
    table: string            // e.g., 'prompt_tags'
    foreignKey: string       // e.g., 'prompt_id'
    relatedKey: string       // e.g., 'tag_id'
  }
}

// Example: Filter prompts by tag
list: {
  filters: [
    {
      field: 'tag_id',
      type: 'combobox',
      optionsFrom: 'tags',
      multiple: true,
      junction: {
        table: 'prompt_tags',
        foreignKey: 'prompt_id',
        relatedKey: 'tag_id'
      }
    }
  ]
}
```

### Filter Operators by Type

```typescript
// String fields
['eq', 'ne', 'contains', 'startswith', 'endswith', 'in', 'nin']

// Number fields
['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'between', 'in', 'nin']

// Date fields
['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'between']

// Boolean fields
['eq']

// UUID/Enum fields
['eq', 'ne', 'in', 'nin']

// Nullable fields (add to any type)
['null', 'nnull']
```

### Saved Filters

```typescript
interface ListConfig {
  filters?: {
    // ... filter definitions

    // Allow saving filter presets
    savePresets?: boolean

    // Storage key for presets
    presetsStorageKey?: string

    // Default preset
    defaultPreset?: string
  }
}
```

---

## Access Control & Permissions

### Role-Based Access Control

```typescript
interface ResourceConfig {
  permissions?: {
    // Action-based permissions (role names)
    list?: string[]              // e.g., ['admin', 'editor', 'viewer']
    create?: string[]            // e.g., ['admin', 'editor']
    edit?: string[]
    delete?: string[]
    show?: string[]

    // Field-level permissions
    fields?: Record<string, {
      view?: string[]
      edit?: string[]
    }>

    // Custom permission check function
    check?: string               // function name
  }
}

// Example
permissions: {
  list: ['admin', 'editor', 'viewer'],
  create: ['admin', 'editor'],
  edit: ['admin', 'editor'],
  delete: ['admin'],
  show: ['admin', 'editor', 'viewer'],

  // Some fields only visible/editable by admin
  fields: {
    views_count: { view: ['admin'], edit: [] },
    internal_notes: { view: ['admin', 'editor'], edit: ['admin'] }
  }
}
```

### Row-Level Security

```typescript
interface ResourceConfig {
  rls?: {
    // Filter records based on user
    listFilter?: {
      field: string              // e.g., 'created_by' or 'organization_id'
      fromUser?: string          // user property to match, e.g., 'id' or 'org_id'
    }

    // Can user edit this specific record?
    canEdit?: string             // function name

    // Can user delete this specific record?
    canDelete?: string
  }
}

// Example: Users can only see/edit their own content
rls: {
  listFilter: {
    field: 'created_by',
    fromUser: 'id'
  }
}
```

---

## Audit Logging & Soft Delete

### Audit Fields

```typescript
interface ResourceConfig {
  // Enable timestamp tracking
  timestamps?: boolean           // adds created_at, updated_at

  // Enable soft delete
  softDelete?: boolean           // adds deleted_at

  // Enable full audit logging
  audit?: {
    enabled: boolean

    // Track who made changes
    trackUser?: boolean          // adds created_by, updated_by

    // Log all changes to separate table
    changelog?: {
      enabled: boolean
      table?: string             // default: '{resource}_changelog'
      retentionDays?: number     // auto-cleanup
    }
  }
}

// Example
audit: {
  enabled: true,
  trackUser: true,
  changelog: {
    enabled: true,
    table: 'prompts_changelog',
    retentionDays: 90
  }
}
```

### Soft Delete Behavior

```typescript
interface ResourceConfig {
  softDelete?: boolean | {
    enabled: boolean

    // Column name for deletion timestamp
    column?: string              // default: 'deleted_at'

    // Cascade soft delete to related records
    cascade?: string[]           // relation names

    // Show deleted records in list (with visual indicator)
    showDeleted?: boolean

    // Allow restore from trash
    allowRestore?: boolean
  }
}

// Example
softDelete: {
  enabled: true,
  column: 'deleted_at',
  cascade: ['children'],
  showDeleted: true,
  allowRestore: true
}
```

---

## Search Configuration

### Global Search

```typescript
interface ListConfig {
  search?: {
    // Fields to search in
    fields: string[]

    // Search mode
    mode: 'contains' | 'startswith' | 'fulltext'

    // Placeholder text
    placeholder?: string

    // Debounce delay (ms)
    debounce?: number            // default: 300

    // Minimum characters to trigger search
    minLength?: number           // default: 2

    // Search across relations
    includeRelations?: Array<{
      relation: string
      fields: string[]
    }>
  }
}

// Example
list: {
  search: {
    fields: ['title', 'description', 'content'],
    mode: 'contains',
    placeholder: 'Search prompts...',
    debounce: 300,
    includeRelations: [
      { relation: 'category', fields: ['name'] },
      { relation: 'tags', fields: ['name'] }
    ]
  }
}
```

### Full-Text Search (PostgreSQL)

```typescript
interface ListConfig {
  search?: {
    mode: 'fulltext'

    // PostgreSQL full-text search configuration
    fulltext?: {
      // Text search config (language)
      config?: string            // e.g., 'english', 'simple'

      // Columns with weights
      columns: Array<{
        name: string
        weight: 'A' | 'B' | 'C' | 'D'
      }>

      // Use generated tsvector column
      vectorColumn?: string
    }
  }
}

// Example
search: {
  mode: 'fulltext',
  fulltext: {
    config: 'english',
    columns: [
      { name: 'title', weight: 'A' },
      { name: 'description', weight: 'B' },
      { name: 'content', weight: 'C' }
    ]
  }
}
```

---

## Pagination & Sorting

### Pagination Configuration

```typescript
interface ListConfig {
  pagination?: {
    // Pagination mode
    mode: 'server' | 'client' | 'infinite'

    // Default page size
    defaultPageSize?: number     // default: 10

    // Page size options
    pageSizeOptions?: number[]   // default: [10, 25, 50, 100]

    // Show total count
    showTotal?: boolean          // default: true

    // Use count estimation for large tables
    countMode?: 'exact' | 'estimated' | 'planned'
  }
}

// Example
list: {
  pagination: {
    mode: 'server',
    defaultPageSize: 25,
    pageSizeOptions: [25, 50, 100],
    countMode: 'estimated'       // faster for large tables
  }
}
```

### Sorting Configuration

```typescript
interface ListConfig {
  sorting?: {
    // Enable multi-column sort
    enableMultiSort?: boolean

    // Default sort
    default?: Array<{ field: string; order: 'asc' | 'desc' }>

    // Allow sorting on computed/related fields
    allowRelatedSort?: boolean

    // Columns that cannot be sorted
    disabledColumns?: string[]
  }
}

// Example
list: {
  sorting: {
    enableMultiSort: true,
    default: [
      { field: 'is_featured', order: 'desc' },
      { field: 'created_at', order: 'desc' }
    ],
    allowRelatedSort: true
  }
}
```

---

## Responsive & Mobile Configuration

```typescript
interface ListConfig {
  responsive?: {
    // Columns to hide on mobile
    hideOnMobile?: string[]

    // Columns to hide on tablet
    hideOnTablet?: string[]

    // Mobile card layout instead of table
    mobileLayout?: 'table' | 'cards'

    // Card configuration for mobile
    card?: {
      title: string              // field for card title
      subtitle?: string          // field for subtitle
      image?: string             // field for image
      badges?: string[]          // fields to show as badges
    }
  }
}

// Example
list: {
  responsive: {
    hideOnMobile: ['description', 'created_at', 'updated_at'],
    hideOnTablet: ['updated_at'],
    mobileLayout: 'cards',
    card: {
      title: 'title',
      subtitle: 'category.name',
      badges: ['tier', 'is_published']
    }
  }
}
```

---

## Route Configuration

```typescript
interface ResourceConfig {
  // Route configuration
  routes?: {
    // Base path (default: table name with dashes)
    basePath?: string            // e.g., '/ai-models'

    // Parent resource for nested routes
    parent?: {
      resource: string
      paramName: string          // e.g., 'categoryId'
    }

    // Disable specific routes
    disabled?: Array<'list' | 'create' | 'edit' | 'show'>

    // Custom route paths
    paths?: {
      list?: string
      create?: string
      edit?: string
      show?: string
    }
  }
}

// Example: Nested routes
routes: {
  basePath: '/ai-models',
  // Or for nested: /ai-providers/:providerId/models
  parent: {
    resource: 'ai_providers',
    paramName: 'providerId'
  }
}
```

---

## Realtime Updates (Supabase)

```typescript
interface ResourceConfig {
  realtime?: {
    // Enable realtime subscriptions
    enabled: boolean

    // Events to subscribe to
    events?: Array<'INSERT' | 'UPDATE' | 'DELETE'>

    // Filter realtime events
    filter?: string              // e.g., 'is_published=eq.true'

    // Auto-refresh behavior
    autoRefresh?: {
      // Refresh list on any change
      list?: boolean

      // Refresh show view when record changes
      show?: boolean

      // Show notification on external change
      notify?: boolean
    }
  }
}

// Example
realtime: {
  enabled: true,
  events: ['INSERT', 'UPDATE', 'DELETE'],
  autoRefresh: {
    list: true,
    show: true,
    notify: true
  }
}
```

---

## Keyboard Shortcuts

```typescript
interface ListConfig {
  shortcuts?: {
    // Enable keyboard navigation
    enabled?: boolean

    // Custom shortcuts
    custom?: Array<{
      key: string               // e.g., 'n', 'Ctrl+n'
      action: string            // action name
      description?: string
    }>
  }
}

// Default shortcuts (when enabled):
// - 'j' / 'k': Navigate up/down
// - 'Enter': Open selected
// - 'e': Edit selected
// - 'd': Delete selected (with confirmation)
// - 'n': New record
// - '/': Focus search
// - 'Escape': Clear selection

// Example
list: {
  shortcuts: {
    enabled: true,
    custom: [
      { key: 'p', action: 'publish', description: 'Toggle publish' },
      { key: 'f', action: 'toggleFeatured', description: 'Toggle featured' }
    ]
  }
}
```

---

## Clone/Duplicate Action

```typescript
interface ResourceConfig {
  // Clone/Duplicate configuration
  clone?: {
    enabled: boolean

    // Fields to exclude from clone (auto-generated fields)
    excludeFields?: string[]     // default: ['id', 'created_at', 'updated_at']

    // Fields to reset to default
    resetFields?: string[]       // e.g., ['is_published', 'views_count']

    // Transform cloned data
    transform?: string           // function name

    // Suffix to add to unique fields
    uniqueSuffix?: {
      field: string              // e.g., 'title', 'id'
      suffix: string             // e.g., ' (Copy)', '-copy'
      pattern?: string           // regex to detect existing suffix
    }

    // Clone related records too
    includeRelations?: string[]  // e.g., ['tags', 'models']
  }
}

// Example
clone: {
  enabled: true,
  excludeFields: ['id', 'created_at', 'updated_at', 'views_count'],
  resetFields: ['is_published', 'is_featured'],
  uniqueSuffix: {
    field: 'title',
    suffix: ' (Copy)',
    pattern: / \(Copy( \d+)?\)$/
  },
  includeRelations: ['tags', 'models']
}
```

---

## Tree View for Hierarchical Data

For resources like categories with parent-child relationships:

```typescript
interface ListConfig {
  // Tree view configuration
  tree?: {
    enabled: boolean

    // Parent field
    parentField: string          // e.g., 'parent_id'

    // Children relation name
    childrenRelation?: string    // e.g., 'children'

    // Display options
    indentSize?: number          // pixels per level, default: 24
    expandable?: boolean         // show expand/collapse
    defaultExpanded?: boolean    // expand all by default

    // Drag and drop reordering
    dragDrop?: {
      enabled: boolean
      // Field to store order
      orderField?: string        // e.g., 'sort_order'
      // Allow moving to different parent
      allowReparent?: boolean
    }
  }
}

// Example for categories
list: {
  tree: {
    enabled: true,
    parentField: 'parent_id',
    childrenRelation: 'children',
    expandable: true,
    defaultExpanded: false,
    dragDrop: {
      enabled: true,
      orderField: 'sort_order',
      allowReparent: true
    }
  }
}
```

---

## Breadcrumbs Configuration

```typescript
interface ResourceConfig {
  // Breadcrumbs configuration
  breadcrumbs?: {
    // Show breadcrumbs
    enabled?: boolean            // default: true

    // Include parent resource
    parent?: {
      resource: string
      labelField: string
      foreignKey: string
    }

    // Custom label for list page
    listLabel?: string           // default: pluralName

    // Show record title in edit/show breadcrumb
    showRecordLabel?: boolean    // default: true
    recordLabelField?: string    // default: labelField
  }
}

// Example
breadcrumbs: {
  enabled: true,
  parent: {
    resource: 'ai_providers',
    labelField: 'name',
    foreignKey: 'provider_id'
  },
  showRecordLabel: true,
  recordLabelField: 'name'
}

// Generated breadcrumbs for AI Model edit:
// Home > AI Providers > OpenAI > AI Models > GPT-4 > Edit
```

---

## Quick Edit Modal

Edit a record without leaving the list view:

```typescript
interface ListConfig {
  // Quick edit configuration
  quickEdit?: {
    enabled: boolean

    // Which fields to show in quick edit
    fields?: string[]            // default: all editable fields

    // Or reference form sections
    sections?: string[]          // section titles to include

    // Modal size
    size?: 'sm' | 'md' | 'lg' | 'xl'

    // Save behavior
    saveOnBlur?: boolean         // auto-save when clicking outside
    showSaveButton?: boolean     // show explicit save button
  }
}

// Example
list: {
  quickEdit: {
    enabled: true,
    fields: ['title', 'category_id', 'tier', 'is_published'],
    size: 'md',
    showSaveButton: true
  }
}
```

---

## Bulk Edit

Edit multiple records at once:

```typescript
interface ListConfig {
  // Bulk edit configuration
  bulkEdit?: {
    enabled: boolean

    // Fields that can be bulk edited
    fields: string[]

    // Require confirmation
    confirm?: boolean

    // Preview changes before applying
    preview?: boolean
  }
}

// Example
list: {
  selectable: true,
  bulkEdit: {
    enabled: true,
    fields: ['category_id', 'tier', 'is_published', 'is_featured'],
    confirm: true,
    preview: true
  }
}
```

---

## Form Tabs & Wizard

### Tabbed Form Sections

```typescript
interface FormConfig {
  // Use tabs instead of stacked sections
  layout?: 'stacked' | 'tabs' | 'wizard'

  // Tab configuration (when layout: 'tabs')
  tabs?: {
    // Position of tabs
    position?: 'top' | 'left'

    // Persist active tab in URL
    persistInUrl?: boolean

    // Validate tab before switching
    validateOnSwitch?: boolean
  }
}

// Example
form: {
  layout: 'tabs',
  tabs: {
    position: 'top',
    persistInUrl: true
  },
  sections: [
    { title: 'Basic Info', fields: ['title', 'id', 'description'] },
    { title: 'Content', fields: ['content'] },
    { title: 'Settings', fields: ['category_id', 'tier'] },
    { title: 'Media', fields: ['images'] },
    { title: 'Relationships', fields: ['tags', 'models'] }
  ]
}
```

### Multi-Step Wizard

```typescript
interface FormConfig {
  layout: 'wizard'

  wizard?: {
    // Show progress indicator
    showProgress?: boolean

    // Allow jumping to any step
    allowSkip?: boolean

    // Validate step before proceeding
    validateSteps?: boolean

    // Labels
    nextLabel?: string
    prevLabel?: string
    submitLabel?: string

    // Summary step at end
    showSummary?: boolean
  }
}

// Example
form: {
  layout: 'wizard',
  wizard: {
    showProgress: true,
    validateSteps: true,
    showSummary: true
  },
  sections: [
    { title: 'Step 1: Basic Info', fields: ['title', 'id', 'description'] },
    { title: 'Step 2: Content', fields: ['content', 'images'] },
    { title: 'Step 3: Settings', fields: ['category_id', 'tier', 'tags', 'models'] }
  ]
}
```

---

## Field Help Text & Tooltips

```typescript
interface FieldConfig {
  // Help text below the field
  description?: string

  // Tooltip on hover (info icon)
  tooltip?: string

  // Show character count (for text fields)
  showCharCount?: boolean

  // Show word count
  showWordCount?: boolean

  // Help link
  helpLink?: {
    label: string
    url: string
  }
}

// Example
fields: {
  content: {
    type: 'richtext',
    label: 'Prompt Content',
    description: 'Write the full prompt that will be sent to the AI model.',
    tooltip: 'Use {placeholders} for dynamic content that users will fill in.',
    showCharCount: true,
    helpLink: {
      label: 'Prompt writing guide',
      url: '/docs/prompt-writing'
    }
  }
}
```

---

## Form Field Prefixes & Suffixes

```typescript
interface FieldConfig {
  // Input prefix (inside input)
  prefix?: string               // e.g., '$', 'https://'

  // Input suffix (inside input)
  suffix?: string               // e.g., 'USD', 'tokens'

  // Addon before input (outside)
  addonBefore?: string | {
    type: 'text' | 'icon' | 'select'
    value: string
    options?: Array<{ label: string; value: string }>
  }

  // Addon after input (outside)
  addonAfter?: string | {
    type: 'text' | 'icon' | 'button'
    value: string
    action?: string
  }
}

// Examples
fields: {
  cost_input_per_million: {
    type: 'number',
    prefix: '$',
    suffix: '/ 1M tokens'
  },
  website_url: {
    type: 'url',
    addonBefore: 'https://'
  },
  slug: {
    type: 'slug',
    addonAfter: {
      type: 'button',
      value: 'Generate',
      action: 'generateSlug'
    }
  }
}
```

---

## Data Transformation & Formatting

```typescript
interface FieldConfig {
  // Transform value for display
  format?: {
    type: 'date' | 'datetime' | 'number' | 'currency' | 'bytes' | 'relative' | 'custom'

    // For date/datetime
    pattern?: string             // e.g., 'DD MMM, YYYY'

    // For number
    decimals?: number
    locale?: string

    // For currency
    currency?: string            // e.g., 'USD'

    // For bytes
    precision?: number

    // For custom
    fn?: string                  // function name
  }

  // Transform value before saving
  transform?: {
    onSave?: string              // function name
    onLoad?: string              // function name
  }
}

// Examples
fields: {
  created_at: {
    type: 'datetime',
    format: { type: 'relative' }  // "2 hours ago"
  },
  cost: {
    type: 'number',
    format: { type: 'currency', currency: 'USD', decimals: 4 }
  },
  file_size: {
    type: 'number',
    format: { type: 'bytes', precision: 2 }  // "1.5 MB"
  }
}
```

---

## Import Validation & Mapping

```typescript
interface ImportConfig {
  // Column mapping configuration
  mapping?: {
    // Strict mode: reject if columns don't match
    strict?: boolean

    // Allow column name aliases
    aliases?: Record<string, string[]>
    // e.g., { 'category_id': ['category', 'cat_id'] }

    // Required columns
    required?: string[]

    // Ignore extra columns
    ignoreExtra?: boolean
  }

  // Row validation
  validation?: {
    // Skip invalid rows or fail entire import
    mode: 'skip' | 'fail'

    // Max errors before stopping
    maxErrors?: number

    // Custom row validator
    validateRow?: string         // function name
  }

  // Duplicate handling
  duplicates?: {
    // How to detect duplicates
    key: string | string[]       // field(s) to check

    // What to do with duplicates
    action: 'skip' | 'update' | 'fail'
  }

  // Post-import actions
  afterImport?: {
    // Refresh related data
    invalidateQueries?: string[]

    // Show summary
    showSummary?: boolean

    // Redirect after import
    redirect?: 'list' | 'stay'
  }
}

// Example
import: {
  mapping: {
    aliases: {
      category_id: ['category', 'cat_id', 'category_name'],
      tag_ids: ['tags', 'tag_names']
    },
    required: ['id', 'title', 'content']
  },
  validation: {
    mode: 'skip',
    maxErrors: 100
  },
  duplicates: {
    key: 'id',
    action: 'update'
  },
  afterImport: {
    invalidateQueries: ['prompts', 'tags'],
    showSummary: true
  }
}
```

---

## Complete Updated Migration Steps

### Phase 1: Core Types & Infrastructure
- [x] Data provider reads relations from meta
- [x] Junction table filtering is generic
- [ ] Create complete TypeScript types (`src/config/types.ts`)
- [ ] Create config validation utility
- [ ] Create config loader with lazy loading

### Phase 2: Config Files for All Resources
- [ ] Create `prompts.ts` config
- [ ] Create `categories.ts` config
- [ ] Create `tags.ts` config
- [ ] Create `ai-models.ts` config
- [ ] Create `ai-providers.ts` config

### Phase 3: Schema Generation Utilities
- [ ] `generateSelectQuery(config)` - Build Supabase select string
- [ ] `generateZodSchema(config)` - Build Zod validation schema
- [ ] `getRelationsForMeta(config)` - Extract manyToMany for data provider
- [ ] `generateDefaultValues(config)` - Build form defaults

### Phase 4: Cell Renderers
- [ ] `BadgeCell` - Enum values with variants
- [ ] `SwitchCell` - Boolean with inline toggle
- [ ] `DateCell` / `DateTimeCell` - Formatted dates
- [ ] `TagsCell` - Array of badges
- [ ] `CountCell` - Number with link to filtered list
- [ ] `ImageCell` - Thumbnail display
- [ ] `LinkCell` - External URL

### Phase 5: Form Field Components
- [ ] Generic `ResourceField` wrapper
- [ ] `RelationField` - belongsTo select
- [ ] `RelationMultiField` - manyToMany multi-select
- [ ] Adapt existing `SlugField`
- [ ] `ImageField` / `ImagesField` wrappers

### Phase 6: ResourceList Component
- [ ] Build `ResourceList` from config
- [ ] Migrate tags list (simplest)
- [ ] Migrate categories list
- [ ] Migrate ai-providers list
- [ ] Migrate ai-models list
- [ ] Migrate prompts list (most complex)

### Phase 7: ResourceForm Component
- [ ] Build `ResourceForm` from config
- [ ] Section rendering
- [ ] Field dependency handling
- [ ] Junction table handling via hooks
- [ ] Migrate all forms

### Phase 8: ResourceShow Component
- [ ] Build `ResourceShow` from config
- [ ] Toggle action buttons
- [ ] Section layouts
- [ ] Migrate prompts show

### Phase 9: Route Generation
- [ ] Create route generator utility
- [ ] Auto-generate routes from config
- [ ] Support nested routes
- [ ] Support custom route overrides

### Phase 10: Advanced Features
- [ ] Config validation at build time
- [ ] TypeScript type generation from config
- [ ] Realtime subscription setup
- [ ] Keyboard shortcuts
- [ ] Documentation generation

---

## Benefits

1. **Single Source of Truth**: Resource schema defined once
2. **Type Safety**: Full TypeScript support
3. **Consistency**: All resources follow same patterns
4. **Rapid Development**: Add new resource = add config file
5. **Maintainability**: Change field = change in one place
6. **Extensibility**: Easy to add new field types, cell types
7. **Less Code**: Eliminate duplicate form/list components

---

## Considerations

### Custom Logic
Some resources may need custom behavior beyond config.

**Solution**: Support component overrides
```typescript
export: {
  transform: 'transformPromptsForExport'  // custom function name
}
```

### Performance
Loading all configs upfront vs lazy loading.

**Solution**: Lazy load configs per resource
```typescript
const config = await loadResourceConfig('prompts')
```

### Validation
Config validation at build time.

**Solution**:
- JSON Schema for validation
- Build-time script to validate all configs
- Zod schema for runtime type checking

### Escape Hatches
Not everything can be configured.

**Solution**: Support custom components
```typescript
fields: {
  specialField: {
    component: 'SpecialFieldComponent'
  }
}
```
