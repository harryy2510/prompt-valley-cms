# PromptValley CMS

Admin CMS for managing PromptValley content - AI prompts, providers, models, categories, and tags.

## Tech Stack

- **Refine** - React-based framework for building admin panels
- **Supabase** - Backend and database
- **React Router v6** - Routing
- **Tailwind CSS** - Styling
- **Shadcn/UI** - UI components (to be added)
- **pnpm** - Package manager
- **TypeScript** - Type safety

## Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Environment Variables
Already configured in `.env`:
```env
VITE_SUPABASE_URL=https://uguvrytefzvyjypcbngo.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

### 3. Run Development Server
```bash
pnpm dev
```

## Project Structure

```
src/
├── App.tsx              # Main Refine setup
├── main.tsx             # Entry point
├── utility/
│   └── supabaseClient.ts # Supabase client configuration
├── pages/
│   ├── dashboard/       # Dashboard/home page
│   ├── ai-providers/    # AI Providers CRUD
│   ├── ai-models/       # AI Models CRUD
│   ├── categories/      # Categories CRUD
│   ├── tags/            # Tags CRUD
│   └── prompts/         # Prompts CRUD
└── components/
    └── ui/              # Shadcn/UI components
```

## Using Refine AI

This project includes a comprehensive prompt in `REFINE_AI_PROMPT.md` that you can use with Refine AI to build the complete CMS.

### How to use it:

1. Open [Refine](https://refine.new/) in your browser
2. Copy the entire contents of `REFINE_AI_PROMPT.md`
3. Paste it into the Refine AI chat
4. Let Refine AI generate the complete admin panel code
5. Copy the generated code into this project

## Database Schema

The CMS manages these tables:

- **ai_providers** - AI companies (OpenAI, Google, Anthropic, etc.)
- **ai_models** - AI models (GPT-4, Claude, Gemini, etc.)
- **categories** - Prompt categories (LinkedIn, Email, Image Generation, etc.)
- **tags** - Prompt tags for filtering
- **prompts** - Main prompt content
- **prompt_tags** - Many-to-many: prompts ↔ tags
- **prompt_models** - Many-to-many: prompts ↔ ai_models

See `REFINE_AI_PROMPT.md` for complete schema details.

## Next Steps

### Option 1: Use Refine AI (Recommended)
1. Use the prompt in `REFINE_AI_PROMPT.md` with Refine AI
2. Generate the complete CMS
3. Copy code into this project
4. Run `pnpm dev`

### Option 2: Manual Development
1. Create `src/utility/supabaseClient.ts`
2. Set up App.tsx with Refine configuration
3. Create pages for each resource
4. Add Shadcn/UI components as needed

## Adding Shadcn/UI

To add Shadcn/UI components:

```bash
pnpm dlx shadcn-ui@latest init
```

Then add components as needed:
```bash
pnpm dlx shadcn-ui@latest add button
pnpm dlx shadcn-ui@latest add form
pnpm dlx shadcn-ui@latest add table
# etc...
```

## Features to Implement

- [ ] Dashboard with stats
- [ ] AI Providers CRUD
- [ ] AI Models CRUD
- [ ] Categories CRUD
- [ ] Tags CRUD
- [ ] Prompts CRUD with relationships
- [ ] Image upload/preview
- [ ] Slug auto-generation
- [ ] Filter and search
- [ ] Bulk actions

## Development Notes

- All tables use TEXT slugs as primary keys (not UUIDs)
- Slugs are auto-generated from name/title fields
- Junction tables handle many-to-many relationships
- RLS policies require service role for admin operations
- Use Supabase service role key for full access

## Useful Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm preview      # Preview production build
```

## Resources

- [Refine Documentation](https://refine.dev/docs/)
- [Refine Supabase Data Provider](https://refine.dev/docs/data/packages/supabase/)
- [Supabase Documentation](https://supabase.com/docs)
- [Shadcn/UI](https://ui.shadcn.com/)
