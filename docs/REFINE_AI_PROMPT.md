# Refine AI Prompt: Build PromptValley CMS

## Project Overview
Build a complete admin CMS for managing a prompt library SaaS called "PromptValley". This is a content management system for AI prompts across multiple platforms (ChatGPT, Claude, Gemini, etc.).

## Tech Stack Requirements
- **Framework**: Refine + React + Vite
- **Data Provider**: Supabase (@refinedev/supabase)
- **Router**: React Router v7
- **Styling**: Tailwind CSS + Shadcn/UI components
- **Package Manager**: pnpm
- **TypeScript**: Enabled

## Supabase Connection Details
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Database Schema

### 1. AI Providers Table
**Table**: `ai_providers`
- `id` (TEXT PRIMARY KEY) - slug-based (e.g., "openai", "google")
- `name` (TEXT NOT NULL UNIQUE) - Display name
- `logo_url` (TEXT) - Logo image URL
- `website_url` (TEXT) - Company website
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 2. AI Models Table
**Table**: `ai_models`
- `id` (TEXT PRIMARY KEY) - slug-based (e.g., "gpt-4", "claude-3-opus")
- `name` (TEXT NOT NULL) - Display name
- `provider_id` (TEXT REFERENCES ai_providers(id))
- `description` (TEXT)
- `capabilities` (TEXT[]) - Array of capabilities
- `context_window` (INTEGER) - Token limit
- `is_active` (BOOLEAN DEFAULT true)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 3. Categories Table
**Table**: `categories`
- `id` (TEXT PRIMARY KEY) - slug-based (e.g., "linkedin-prompts", "image-generation")
- `name` (TEXT NOT NULL UNIQUE) - Display name
- `description` (TEXT)
- `icon` (TEXT) - Icon identifier
- `sort_order` (INTEGER)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 4. Tags Table
**Table**: `tags`
- `id` (TEXT PRIMARY KEY) - slug-based (e.g., "content-marketing", "seo")
- `name` (TEXT NOT NULL UNIQUE) - Display name
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 5. Prompts Table
**Table**: `prompts`
- `id` (TEXT PRIMARY KEY) - slug-based (e.g., "linkedin-about-generator")
- `title` (TEXT NOT NULL) - Prompt title
- `description` (TEXT) - Brief description
- `content` (TEXT NOT NULL) - The actual prompt text
- `images` (TEXT[]) - Array of image URLs
- `category_id` (TEXT REFERENCES categories(id))
- `tier` (ENUM: 'free' | 'pro') - Access level
- `views_count` (INTEGER DEFAULT 0)
- `saves_count` (INTEGER DEFAULT 0)
- `copies_count` (INTEGER DEFAULT 0)
- `is_featured` (BOOLEAN DEFAULT false)
- `is_published` (BOOLEAN DEFAULT false)
- `sort_order` (INTEGER)
- `created_by` (UUID REFERENCES users(id))
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `published_at` (TIMESTAMPTZ)

### 6. Prompt Tags (Junction Table)
**Table**: `prompt_tags`
- `prompt_id` (TEXT REFERENCES prompts(id) ON DELETE CASCADE)
- `tag_id` (TEXT REFERENCES tags(id) ON DELETE CASCADE)
- `created_at` (TIMESTAMPTZ)
- PRIMARY KEY: (prompt_id, tag_id)

### 7. Prompt Models (Junction Table)
**Table**: `prompt_models`
- `prompt_id` (TEXT REFERENCES prompts(id) ON DELETE CASCADE)
- `model_id` (TEXT REFERENCES ai_models(id) ON DELETE CASCADE)
- `created_at` (TIMESTAMPTZ)
- PRIMARY KEY: (prompt_id, model_id)

## Key Features to Implement

### 1. Dashboard (Home Page)
- Quick stats cards:
  - Total prompts (published/draft)
  - Total categories
  - Total tags
  - Total AI models
- Recent activity feed
- Quick actions (Create Prompt, Add Category, etc.)

### 2. AI Providers Resource
**List Page:**
- Data table with columns: Logo, Name, Website, Created Date, Actions
- Search by name
- Create/Edit/Delete actions
- Inline logo preview

**Create/Edit Form:**
- Name field (auto-generates slug ID)
- Logo URL input with image preview
- Website URL input
- Form validation

### 3. AI Models Resource
**List Page:**
- Data table with: Name, Provider, Context Window, Active Status, Actions
- Filter by provider
- Filter by active/inactive
- Search by name

**Create/Edit Form:**
- Name field (auto-generates slug ID)
- Provider select (dropdown from ai_providers)
- Description textarea
- Capabilities multi-select/tags input
- Context window number input
- Active status toggle
- Form validation

### 4. Categories Resource
**List Page:**
- Data table with: Icon, Name, Description, Sort Order, Actions
- Drag-and-drop reordering support (optional)
- Search by name

**Create/Edit Form:**
- Name field (auto-generates slug ID)
- Description textarea
- Icon picker/input
- Sort order number input
- Form validation

### 5. Tags Resource
**List Page:**
- Data table with: Name, Created Date, Prompt Count (optional), Actions
- Search by name
- Bulk delete option

**Create/Edit Form:**
- Name field (auto-generates slug ID)
- Simple form with validation

### 6. Prompts Resource (Most Complex)
**List Page:**
- Data table with: Title, Category, Tier Badge, Status (published/draft), Views, Actions
- Filter by:
  - Category (dropdown)
  - Tier (free/pro)
  - Status (published/draft/featured)
- Search by title
- Bulk actions (publish/unpublish, feature/unfeature)

**Create/Edit Form:**
- Title field (auto-generates slug ID)
- Description textarea
- Content textarea (large, main prompt text)
- Category select
- Tags multi-select (from tags table)
- AI Models multi-select (from ai_models table via prompt_models junction)
- Image URLs array input (multiple images)
- Tier radio/select (free/pro)
- Is Featured toggle
- Is Published toggle
- Sort order number input
- Rich preview of the prompt

**Show/Detail Page:**
- Full prompt display
- Associated tags, models, category
- Engagement metrics (views, saves, copies)
- Edit/Delete actions

## Important Implementation Notes

### Slug-Based Primary Keys
All main tables use TEXT slugs as primary keys instead of UUIDs:
- Auto-generate slugs from `name` or `title` fields
- Format: lowercase, hyphens, alphanumeric only
- Example: "GPT-4 Turbo" → "gpt-4-turbo"
- Show slug field as readonly/disabled on edit forms

### Junction Tables (Many-to-Many)
- **prompt_tags**: Connect prompts to multiple tags
- **prompt_models**: Connect prompts to multiple AI models
- Use Refine's relation features to handle these properly
- Create UI for multi-select in forms

### Tier-Based Access
- Prompts have a `tier` field: 'free' or 'pro'
- Display with visual badge/chip
- Color code: Blue for free, Purple for pro

### RLS Policies
The database has Row Level Security enabled:
- Service role key required for admin operations
- All tables have admin policies for full CRUD
- For development, use service role key

### Form Behavior
- **Slug Generation**: When creating new records, generate slug from name/title automatically
- **Slug Display**: On edit forms, show slug as readonly field
- **Timestamps**: `created_at` and `updated_at` are auto-managed by database triggers
- **Published Date**: Auto-set `published_at` when `is_published` changes to true

### UI/UX Requirements
- Clean, modern interface using Shadcn/UI components
- Responsive design (works on mobile/tablet/desktop)
- Loading states and error handling
- Success/error toast notifications
- Confirmation dialogs for delete actions
- Image previews for logo_url and images arrays

## Refine Configuration

### Data Provider Setup
```typescript
import { dataProvider } from "@refinedev/supabase";
import { supabaseClient } from "./utility";

dataProvider(supabaseClient)
```

### Resource Configuration
Define all 5 main resources:
1. `ai-providers` (or `ai_providers`)
2. `ai-models` (or `ai_models`)
3. `categories`
4. `tags`
5. `prompts`

Each resource should have:
- `list` - Data table page
- `create` - Create form
- `edit` - Edit form
- `show` - Detail view (especially for prompts)

### Authentication
- Use Supabase Auth integration
- Admin-only access (check user role or use service_role)
- Login/logout pages

## File Structure Suggestion
```
src/
├── App.tsx (Main Refine setup)
├── utility/supabaseClient.ts (Supabase client)
├── pages/
│   ├── dashboard/
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
│   └── ui/ (Shadcn components)
└── types/
    └── database.types.ts
```

## Testing Checklist
After implementation, verify:
- [ ] Can create/edit/delete AI providers
- [ ] Can create/edit/delete AI models with provider relationship
- [ ] Can create/edit/delete categories
- [ ] Can create/edit/delete tags
- [ ] Can create prompts with all relationships (category, tags, models)
- [ ] Slug auto-generation works correctly
- [ ] Image previews display properly
- [ ] Filter and search functionality works
- [ ] Tier badges display correctly
- [ ] Timestamps are set automatically
- [ ] Delete confirmations appear
- [ ] Success/error messages show
- [ ] Forms validate required fields
- [ ] Dashboard stats display correctly

## Additional Features (Nice to Have)
- Bulk import prompts from CSV/JSON
- Duplicate prompt functionality
- Prompt template/clone feature
- Rich text editor for prompt content
- Markdown support in descriptions
- Analytics dashboard for engagement metrics
- Export functionality (CSV, JSON)

## Questions to Consider
- Should there be user management in the CMS?
- Do you need approval workflows for publishing?
- Should there be version history for prompts?
- Do you need multi-language support?

---

**Start by setting up the base Refine app with Supabase data provider, then implement resources one by one in this order: AI Providers → AI Models → Categories → Tags → Prompts**
