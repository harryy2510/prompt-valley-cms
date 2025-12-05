## Project: PromptValley CMS

### Overview

An admin panel for managing AI prompts, models, and content metadata. Content managers and admins will use this to create, organize, and publish AI prompts with detailed metadata, relationships to AI models, categories, and tags. The system supports multi-tier prompts (free/pro), image uploads, and comprehensive search/filtering capabilities.

### Tech Stack & Configuration

- Framework: Refine + React + Vite
- Data Provider: Supabase (@refinedev/supabase)
- Router: React Router v7
- Styling: Tailwind CSS + Shadcn/UI components
- Package Manager: pnpm
- Language: TypeScript

Supabase Connection: Service role key required for admin operations (RLS enabled on all tables)

### Database Schema

#### 1\. AI Providers Table

```
ai_providers:
  - id (TEXT PRIMARY KEY)
  - name (TEXT NOT NULL UNIQUE)
  - logo_url (TEXT)
  - website_url (TEXT)
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)
```

#### 2\. AI Models Table

```
ai_models:
  - id (TEXT PRIMARY KEY)
  - name (TEXT NOT NULL)
  - provider_id (TEXT REFERENCES ai_providers)
  - capabilities (ModelCapability[]) - Array: 'text' | 'image' | 'video' | 'code'
  - context_window (INTEGER)
  - cost_input_per_million (NUMERIC)
  - cost_output_per_million (NUMERIC)
  - max_output_tokens (INTEGER)
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)
```

#### 3\. Categories Table

```
categories:
  - id (TEXT PRIMARY KEY)
  - name (TEXT NOT NULL UNIQUE)
  - parent_id (TEXT) - For hierarchical categories
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)
```

#### 4\. Tags Table

```
tags:
  - id (TEXT PRIMARY KEY)
  - name (TEXT NOT NULL UNIQUE)
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)
```

#### 5\. Prompts Table

```
prompts:
  - id (TEXT PRIMARY KEY)
  - title (TEXT NOT NULL)
  - description (TEXT)
  - content (TEXT NOT NULL)
  - images (TEXT[])
  - category_id (TEXT REFERENCES categories)
  - tier (Tier: 'free' | 'pro')
  - views_count (INTEGER DEFAULT 0)
  - saves_count (INTEGER DEFAULT 0)
  - copies_count (INTEGER DEFAULT 0)
  - is_featured (BOOLEAN DEFAULT false)
  - is_published (BOOLEAN DEFAULT false)
  - sort_order (INTEGER)
  - created_by (TEXT REFERENCES users)
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)
  - published_at (TIMESTAMPTZ)
```

#### 6\. Prompt Tags (Junction Table)

```
prompt_tags:
  - prompt_id (TEXT REFERENCES prompts ON DELETE CASCADE)
  - tag_id (TEXT REFERENCES tags ON DELETE CASCADE)
  - created_at (TIMESTAMPTZ)
  - PRIMARY KEY (prompt_id, tag_id)
```

#### 7\. Prompt Models (Junction Table)

```
prompt_models:
  - prompt_id (TEXT REFERENCES prompts ON DELETE CASCADE)
  - model_id (TEXT REFERENCES ai_models ON DELETE CASCADE)
  - created_at (TIMESTAMPTZ)
  - PRIMARY KEY (prompt_id, model_id)
```

#### 8\. Users Table (Reference)

```
users:
  - id (TEXT PRIMARY KEY)
  - email (TEXT NOT NULL UNIQUE)
  - name (TEXT)
  - avatar_url (TEXT)
  - tier (Tier: 'free' | 'pro')
  - stripe_subscription_id (TEXT)
  - stripe_subscription_status (TEXT)
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)
```

#### 9\. User Favorites (Optional)

```
user_favorites:
  - id (TEXT PRIMARY KEY)
  - user_id (TEXT REFERENCES users)
  - prompt_id (TEXT REFERENCES prompts)
  - created_at (TIMESTAMPTZ)
```

Type Enums:

- `Tier`: 'free' | 'pro'
- `ModelCapability`: 'text' | 'image' | 'video' | 'code'

### Key Implementation Guidelines

#### Slug Generation

- Auto-generate slugs from`name`or`title`fields
- Format: lowercase, hyphens, alphanumeric only
- Example: "GPT-4 Turbo" → "gpt-4-turbo"
- Display slug as readonly field on edit forms

#### Tier Badges

- Free tier: Blue badge
- Pro tier: Purple badge

#### Form Behavior

- Slug generation happens automatically when creating new records
- Timestamps (created_at, updated_at) are auto-managed by database
- published_at auto-set when is_published changes to true
- Validation required for all mandatory fields

#### UI/UX Standards

- Confirmation dialogs for all delete operations
- Success/error toast notifications for all CRUD actions
- Image previews for logo_url and images arrays
- Loading states and error handling on all pages
- Responsive design (mobile, tablet, desktop)

---

### Authentication & Access Control

- Admin-only access to the CMS (all authenticated users are considered admins)
- Supabase Auth integration for login/logout
- Service role key required in backend for RLS-enabled operations
- Row Level Security (RLS) policies on all tables for admin operations
- created_by field auto-populated with current user UUID on prompt creation

### Nice-to-Have Features (Future Phases)

These features are noted for potential implementation but NOT part of the current 6-phase plan:

- Bulk import prompts from CSV/JSON files
- Duplicate prompt functionality
- Prompt template/clone feature
- Rich text editor for prompt content
- Markdown support in descriptions
- Advanced analytics dashboard with engagement trends
- Export functionality (CSV, JSON) for all resources
- Version history tracking for prompts
- Multi-language support
- User role management (different admin levels)
- Approval workflows for publishing
- Comment/collaboration on prompts

### Suggested File Structure

```
src/
├── App.tsx (Main Refine setup with resources and layout)
├── utility/
│   └── supabaseClient.ts (Supabase client initialization)
├── pages/
│   ├── dashboard/
│   │   └── index.tsx (Dashboard landing page)
│   ├── ai-providers/
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   └── edit.tsx
│   ├── ai-models/
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   └── edit.tsx
│   ├── categories/
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   └── edit.tsx
│   ├── tags/
│   │   ├── list.tsx
│   │   ├── create.tsx
│   │   └── edit.tsx
│   └── prompts/
│       ├── list.tsx
│       ├── create.tsx
│       ├── edit.tsx
│       └── show.tsx
├── components/
│   ├── common/
│   │   ├── ImagePreview.tsx
│   │   ├── SlugDisplay.tsx
│   │   ├── TierBadge.tsx
│   │   ├── DeleteConfirmation.tsx
│   │   └── LoadingSkeletons.tsx
│   ├── dashboard/
│   │   ├── StatsCards.tsx
│   │   ├── Charts.tsx
│   │   └── RecentActivity.tsx
│   └── ui/ (Shadcn/UI components - pre-existing)
├── hooks/
│   ├── useSlugGeneration.ts
│   ├── useImagePreview.ts
│   └── useFilterPresets.ts
├── types/
│   ├── database.types.ts (Generated from Supabase)
│   └── index.ts
└── lib/
    ├── supabase-utils.ts (Helper functions)
    └── slug-generator.ts (Slug generation logic)
```

### Implementation Order

1.  Phase 1: Set up Refine app, Supabase client, AI Providers resource
2.  Phase 2: Add AI Models and Categories resources
3.  Phase 3: Add Tags resource and verify junction table setup
4.  Phase 4: Implement Prompts core CRUD (list, create, edit, show)
5.  Phase 5: Add multi-select for tags/models, image handling, advanced filters
6.  Phase 6: Build dashboard, implement reporting, add polish and notifications

Each phase builds on the previous one. Resource relationships require resources to exist first (e.g., Models need Providers from Phase 1).

---

### Phase 1: Foundation & AI Providers

Foundation setup with the first core resource: managing AI providers (platforms like OpenAI, Claude, Gemini, etc.). Users can list, create, and edit providers with auto-generated slugs and logo previews.

#### Key Features

- AI providers directory with logo management
- Auto-slug generation from provider name (readonly display on edit)
- Logo URL preview in list and edit views
- Simple, clean provider forms with validation
- Search and filter by provider name

#### Tasks

- [ ] Display list of AI providers in data table with columns: Logo, Name, Website, Created Date, Actions
- [ ] Search providers by name
- [ ] Create new AI provider with name, logo URL, and website URL
- [ ] Auto-generate slug ID from provider name (display as readonly on forms)
- [ ] Preview provider logo in list view (thumbnail) and edit form (full preview)
- [ ] Edit provider details (name, logo URL, website URL)
- [ ] Delete providers with confirmation dialog
- [ ] Show validation errors for required fields (name is mandatory)
- [ ] Display success/error toast notifications for create/update/delete actions
- [ ] Handle image preview errors gracefully (fallback placeholder if URL invalid)

#### Notes

- AI Providers table schema: id (TEXT slug), name, logo_url, website_url, created_at, updated_at
- Slug format: lowercase-hyphenated (e.g., "openai" from "OpenAI", "google" from "Google")
- Name field is required and must be unique
- Logo URL is optional but should preview if provided
- Use Supabase data provider for all CRUD operations
- All form validations should prevent submission of incomplete records
- Delete confirmations required before removal

Phase 1 Status: Complete ✅

---

### Phase 2: AI Models & Categories

Expand to manage AI models and categories. Users can organize models by provider and manage category hierarchies for prompt organization.

#### Key Features

- AI models list with provider filtering and search
- Model creation with provider relationship, capabilities array, and active status
- Categories management with custom sort ordering
- Icon selector for category visualization
- Active/inactive status filtering for models

#### Tasks

- [ ] Display AI models list in data table with columns: Name, Provider, Context Window, Active Status, Created Date, Actions
- [ ] Search AI models by name
- [ ] Filter AI models by provider (dropdown select)
- [ ] Filter AI models by active/inactive status
- [ ] Create new AI model with name, provider selection, and other details
- [ ] Auto-generate model slug ID from model name (readonly display)
- [ ] Add capabilities as array input (comma-separated or tag-style) to model form
- [ ] Input context window as integer number field
- [ ] Toggle is_active status on models
- [ ] Edit model details including all fields (provider, capabilities, context window, active status)
- [ ] Delete models with confirmation dialog
- [ ] Display list of categories in data table with columns: Icon, Name, Description, Sort Order, Actions
- [ ] Create new category with name, description, icon, and sort order
- [ ] Auto-generate category slug ID from category name (readonly display)
- [ ] Edit category details and update sort order
- [ ] Delete categories with confirmation dialog
- [ ] Show success/error notifications for all category operations
- [ ] Validate that provider is selected when creating/editing models

#### Notes

- AI Models table: id (TEXT slug), name, provider_id (FK to ai_providers), description, capabilities (TEXT[]), context_window (INT), is_active (BOOL), timestamps
- Categories table: id (TEXT slug), name, description, icon, sort_order, timestamps
- Auto-generate slugs for both resources from name field
- Provider dropdown must load from ai_providers table (established in Phase 1)
- Capabilities field: support comma-separated input and store as array
- Icon field: simple text input (e.g., "book", "lightbulb", "folder")
- Sort order allows custom ordering in category list/dropdown
- Context window represents token limit for the model
- is_active toggle determines if model is available for prompt association

Phase 2 Status: Complete ✅

---

### Phase 3: Tags & Relationship Setup

Lightweight tag management and preparation of junction tables for many-to-many relationships between prompts, tags, and models.

#### Key Features

- Simple tag creation and management with auto-slug generation
- Tag search and filtering
- Tag usage tracking (how many prompts use each tag)
- Bulk delete capability

#### Tasks

- [ ] Display list of all tags in data table with columns: Name, Created Date, Usage Count, Actions
- [ ] Search tags by name
- [ ] Create new tags with name field and auto-generated slug ID
- [ ] Auto-generate tag slug ID from tag name (readonly display on form)
- [ ] Edit tag name and see updated slug
- [ ] Delete individual tags with confirmation dialog
- [ ] Support bulk delete for multiple tags (with confirmation)
- [ ] Show tag usage count (number of prompts using each tag)
- [ ] Display success/error notifications for all tag operations
- [ ] Validate that tag name is unique before creating/updating

#### Notes

- Tags table: id (TEXT slug), name (UNIQUE), timestamps
- Auto-generate slugs from name field (e.g., "Content Marketing" → "content-marketing")
- Usage count calculated from prompt_tags junction table
- Junction tables (prompt_tags, prompt_models) are database-level only---not directly edited via UI
- Junction table relationships managed through Prompts resource (Phase 4-5)
- Keep tag management simple: focus on basic CRUD and naming
- Tags are used for categorizing prompts across different domains

Phase 3 Status: Complete ✅

---

### Phase 4: Prompts Core CRUD

Core prompt creation, editing, and listing with essential fields. Users can manage basic prompt metadata and content. Includes list page, create/edit forms, and detail view.

#### Key Features

- Prompt list with search and basic sorting
- Prompt creation with core metadata and content
- Prompt editing with all core fields editable
- Prompt detail/show view with full information and engagement metrics
- Category assignment for all prompts
- Tier selection (free/pro) with visual badges

#### Tasks

- [ ] Fix runtime error (undefined reference) -Environment variables not loading, dev server restart required
- [ ] Display list of all prompts in data table with columns: Title, Category, Tier Badge, Status (published/draft), Views Count, Actions

#### Notes

- Prompts table schema: id (TEXT slug), title, description, content (TEXT NOT NULL), category_id (FK), tier (ENUM: 'free'|'pro'), views_count, saves_count, copies_count, is_featured, is_published, sort_order, created_by (UUID), timestamps, published_at
- Auto-generate slugs from title field
- Content field is the main prompt text (required)
- Description is optional (brief summary of the prompt)
- Category assignment is optional (some prompts may not be categorized)
- Tier field determines access level (free or pro)
- Tier badges: Blue for free, Purple for pro
- is_featured flag (toggled in Phase 5)
- is_published flag controls whether prompt is visible (draft vs published)
- Engagement metrics (views_count, saves_count, copies_count) are read-only (managed externally)
- created_by tracks which admin created the prompt
- published_at auto-set when is_published changes to true

---

### Phase 5: Prompts Advanced Features

Advanced prompt management with multi-relationship support, image handling, and detailed filtering. Users can associate prompts with multiple models and tags, upload/manage images, and use advanced filters.

#### Key Features

- Multi-model selection per prompt (via prompt_models junction table)
- Multi-tag assignment per prompt (via prompt_tags junction table)
- Image array management with URL previews
- Advanced filtering by category, tier, status, and featured flag
- Featured prompt flag toggle
- Bulk operations for prompts (publish/unpublish, feature/unfeature, delete)

#### Tasks

- [ ] Add multi-select dropdown for AI models in prompt form (searchable, shows model name + provider)
- [ ] Associate multiple AI models to a prompt via prompt_models junction table
- [ ] Edit prompt to add/remove models
- [ ] Add multi-select component for tags in prompt form (searchable, shows tag names)
- [ ] Assign multiple tags to a prompt via prompt_tags junction table
- [ ] Edit prompt to add/remove tags
- [ ] Display selected tags and models on prompt detail page
- [ ] Add image URL input fields to prompt form (array of image URLs)
- [ ] Support adding multiple images (dynamic array of image URLs)
- [ ] Preview images in form and detail view
- [ ] Remove individual images from prompt
- [ ] Display all associated images on prompt detail page with previews
- [ ] Filter prompts by category (dropdown select, shows all categories)
- [ ] Filter prompts by tier (checkbox for free, checkbox for pro, or toggle)
- [ ] Filter prompts by publish status (published, draft, all)
- [ ] Toggle is_featured flag on prompts (makes prompt featured/unfeatured)
- [ ] Display featured prompts separately or with feature badge in list
- [ ] Implement bulk operations: select multiple prompts and publish all
- [ ] Implement bulk operations: select multiple prompts and feature all
- [ ] Implement bulk operations: select multiple prompts and delete all (with confirmation)
- [ ] Show active filter chips on list page with option to clear filters

#### Notes

- Junction tables: prompt_tags (prompt_id, tag_id) and prompt_models (prompt_id, model_id)
- Use Refine's relation/nested feature to handle junction table operations
- Multi-select components must be searchable and user-friendly
- Images stored as TEXT[] array in prompts table
- Image previews should handle URL errors gracefully (fallback placeholder)
- Filters should be cumulative (filter by category AND tier)
- Featured flag affects visibility and organization on front-end (admin toggle only)
- Bulk operations need confirmation dialog
- Filter state should persist during session (or use saved presets in Phase 6)

---

### Phase 6: Dashboard, Reporting & Polish

Analytics dashboard with key metrics, advanced filtering refinements, and UI/UX polish across all resources. Final phase includes testing, performance optimization, and system-wide enhancements.

#### Key Features

- Admin dashboard landing page with statistics cards
- Key metrics widgets (prompts, categories, models, tags, providers)
- Engagement tracking (most-viewed, most-saved prompts)
- Distribution charts (category breakdown, tier distribution)
- Quick-access buttons for creating new resources
- Saved filter presets for common views
- Global search across all resources
- Toast notifications and loading states throughout

#### Tasks

- [ ] Display dashboard landing page showing system overview
- [ ] Create stats cards for: total prompts (published + draft), total AI providers, total AI models, total categories, total tags
- [ ] Display published vs draft prompt counts separately
- [ ] Create widget showing most-viewed prompts (top 5-10 by views_count)
- [ ] Create widget showing most-saved prompts (top 5-10 by saves_count)
- [ ] Create chart showing prompt distribution by category
- [ ] Create chart showing tier distribution (free vs pro prompt count)
- [ ] Add quick-action buttons to dashboard: Create Prompt, Create Category, Create Tag, Add AI Model, Add Provider
- [ ] Implement global search bar that searches across: providers, models, categories, tags, prompts
- [ ] Create saved filter presets (e.g., "Published Free Prompts", "Featured Only", "Pro Only")
- [ ] Store filter presets in localStorage or user preferences
- [ ] Display available presets and allow one-click application
- [ ] Implement success toast notifications for all create operations
- [ ] Implement success toast notifications for all update operations
- [ ] Implement success toast notifications for all delete operations
- [ ] Implement error toast notifications with error messages
- [ ] Add loading skeletons/spinners to all list views during data fetch
- [ ] Implement pagination on all list views (20-50 items per page)
- [ ] Add recent activity feed on dashboard (latest created/updated records)
- [ ] Optimize list view queries and caching with Refine

#### Notes

- Dashboard serves as landing page/home after login
- Use stats cards component from Shadcn/UI
- Charts use Recharts library (compatible with Shadcn/UI setup)
- All CRUD success/error states should trigger toast notifications
- Pagination required for large datasets (implement Refine pagination)
- Global search should be cross-resource (results grouped by resource type)
- Filter presets stored in browser localStorage with user-friendly names
- Loading states critical for UX during API calls
- Responsive design: dashboard works on mobile, tablet, desktop
- Include error boundaries and graceful error handling throughout
- Performance: lazy load chart data, implement efficient filtering

#### Testing Checklist

- [ ] Can create/edit/delete AI providers with logo preview
- [ ] Can create/edit/delete AI models with provider relationship
- [ ] Can create/edit/delete categories with icon display
- [ ] Can create/edit/delete tags with usage tracking
- [ ] Can create prompts with category, tier, content, and metadata
- [ ] Can edit prompts and update all fields including relationships
- [ ] Can delete prompts with confirmation dialog
- [ ] Slug auto-generation works correctly for all resources
- [ ] Image previews display properly (logos and prompt images)
- [ ] Filter functionality works on all lists (category, tier, status, provider, etc.)
- [ ] Search functionality works across all resources
- [ ] Tier badges display with correct colors (free=blue, pro=purple)
- [ ] Timestamps auto-managed correctly by database
- [ ] Delete confirmations appear before deletion
- [ ] Success/error toast messages appear for all operations
- [ ] Form validation prevents incomplete submissions
- [ ] Multi-select for tags and models works correctly
- [ ] Junction table relationships (prompt_tags, prompt_models) save correctly
- [ ] Dashboard stats calculate correctly
- [ ] Charts render properly with accurate data
- [ ] Pagination works correctly on large lists
- [ ] Bulk operations complete successfully
- [ ] Global search returns results from all resources
