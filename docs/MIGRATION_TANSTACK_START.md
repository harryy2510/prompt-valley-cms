# Migration Guide: Prompt Valley CMS → TanStack Start + SSR

> **Status**: Planning Phase
> **Target**: Server-side rendering with secure Supabase service role key

## Table of Contents

1. [Overview](#overview)
2. [Current vs Target Architecture](#current-vs-target-architecture)
3. [Prerequisites](#prerequisites)
4. [Phase 1: Custom TanStack Router Provider](#phase-1-custom-tanstack-router-provider)
5. [Phase 2: Project Structure Migration](#phase-2-project-structure-migration)
6. [Phase 3: Server-Side Supabase](#phase-3-server-side-supabase)
7. [Phase 4: Route Migration](#phase-4-route-migration)
8. [Phase 5: Data Provider Migration](#phase-5-data-provider-migration)
9. [Phase 6: Auth Provider Migration](#phase-6-auth-provider-migration)
10. [Phase 7: Testing & Deployment](#phase-7-testing--deployment)
11. [Rollback Plan](#rollback-plan)
12. [References](#references)

---

## Overview

### Why Migrate?

1. **Security**: Use Supabase service role key on server-side only (never exposed to client)
2. **Performance**: Server-side rendering for faster initial page loads
3. **Type Safety**: TanStack Router's inferred route types
4. **Edge Deployment**: Deploy to Cloudflare Workers for global edge performance
5. **Modern Stack**: Align with vouch-ui architecture for consistency

### Key Challenges

| Challenge | Solution |
|-----------|----------|
| Refine doesn't support TanStack Router | Create custom `routerProvider` |
| Route definition differences | Migrate to file-based routing |
| SSR hydration with Refine hooks | Use `beforeLoad` for server data fetching |
| Secure Supabase operations | Server functions with service role key |

---

## Current vs Target Architecture

### Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                             │
├─────────────────────────────────────────────────────────┤
│  React + Vite (Client-Side Only)                        │
│  ├── React Router v6                                    │
│  ├── @refinedev/react-router                            │
│  ├── Supabase Client (anon key) ──────┐                │
│  └── Refine (dataProvider, authProvider)               │
└───────────────────────────────────────│─────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase                              │
│  (All queries use anon key with RLS)                    │
└─────────────────────────────────────────────────────────┘
```

### Target Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                             │
├─────────────────────────────────────────────────────────┤
│  React (Hydrated Client)                                │
│  ├── TanStack Router                                    │
│  ├── Custom Refine Router Provider                      │
│  ├── React Query (client state)                         │
│  └── NO Supabase Client (all queries via server)       │
└───────────────────────────────────────│─────────────────┘
                                        │
                                        │ Server Functions
                                        ▼
┌─────────────────────────────────────────────────────────┐
│   TanStack Start Server (Cloudflare Workers)            │
│   ├── Server Functions (all data operations)            │
│   ├── Supabase Admin Client (service role key)          │
│   ├── SSR Rendering                                     │
│   └── Auth Session Management                           │
└───────────────────────────────────────│─────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────┐
│                       Supabase                          │
│  ├── Database (Postgres) ─── No RLS needed (admin key) │
│  ├── Auth                                               │
│  ├── Storage                                            │
│  └── Realtime (optional, client subscription)           │
└─────────────────────────────────────────────────────────┘
```

> **Key Change**: No Supabase client in browser. All database/storage operations go through server functions using the service role key. This eliminates RLS complexity and keeps credentials secure.

---

## Prerequisites

### Install Dependencies

```bash
# Remove old router
pnpm remove @refinedev/react-router react-router react-router-dom

# Add TanStack Start & Router
pnpm add @tanstack/react-start @tanstack/react-router @tanstack/react-router-devtools

# Add Vite plugin for TanStack
pnpm add -D @tanstack/router-plugin
```

### Environment Variables

```env
# .env (development)
VITE_SUPABASE_URL=https://xxx.supabase.co  # Public
VITE_SUPABASE_ANON_KEY=eyJ...              # Client-side (auth listeners & OTP only)
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # Server-side only (secret)

# .env.production
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...              # Client-side (auth listeners & OTP only)
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # Set in deployment platform secrets
```

> **Note**: Anon key is ONLY used for auth state listeners and OTP flow. All data operations go through server functions using the service role key.

---

## Phase 1: Custom TanStack Router Provider

Create a custom router provider that implements Refine's `RouterProvider` interface using TanStack Router hooks.

### File: `src/libs/refine/tanstack-router-provider.tsx`

```typescript
import { forwardRef, useCallback } from 'react'
import {
  useNavigate,
  useParams,
  useLocation,
  useSearch,
  Link as TanStackLink,
  type LinkProps,
} from '@tanstack/react-router'
import { matchResourceFromRoute, type RouterProvider, type ResourceProps } from '@refinedev/core'
import qs from 'qs'

/**
 * Factory function to create TanStack Router provider for Refine
 * Takes resources as a parameter to avoid global state
 */
export function createRouterBindings(resources: ResourceProps[]): RouterProvider {
  return {
    /**
     * Navigation function
     * Handles push, replace, and path-only modes
     */
    go: () => {
      const navigate = useNavigate()
      const location = useLocation()

      return useCallback(
        ({
          to,
          query,
          hash,
          options = {},
          type = 'push',
        }: {
          to?: string
          query?: Record<string, unknown>
          hash?: string
          options?: { keepQuery?: boolean; keepHash?: boolean }
          type?: 'push' | 'replace' | 'path'
        }) => {
          const { keepQuery, keepHash } = options

          // Build query string
          let urlQuery = query || {}
          if (keepQuery) {
            const currentQuery = qs.parse(location.searchStr, {
              ignoreQueryPrefix: true,
            })
            urlQuery = { ...currentQuery, ...query }
          }

          const queryString = Object.keys(urlQuery).length
            ? `?${qs.stringify(urlQuery, { encode: false })}`
            : ''

          // Build hash
          const currentHash = location.hash
          const hashString = hash
            ? `#${hash}`
            : keepHash && currentHash
              ? currentHash
              : ''

          // Build final path
          const targetPath = to || location.pathname
          const fullPath = `${targetPath}${queryString}${hashString}`

          // Return path string or navigate
          if (type === 'path') {
            return fullPath
          }

          navigate({
            to: fullPath,
            replace: type === 'replace',
          })
        },
        [navigate, location],
      )
    },

    /**
     * Back navigation
     */
    back: () => {
      return useCallback(() => {
        window.history.back()
      }, [])
    },

    /**
     * Parse current route to extract resource, action, id, and params
     * Resources are passed via closure - no global state needed
     */
    parse: () => {
      const params = useParams({ strict: false })
      const location = useLocation()
      const search = useSearch({ strict: false }) as Record<string, unknown>

      return useCallback(() => {
        // Match resource from route using closure reference
        const { resource, action, matchedRoute } = matchResourceFromRoute(
          location.pathname,
          resources,
        )

        // Extract ID from params
        const id = (params as any)?.id

        // Parse pagination params
        const current = search?.current
          ? Number(search.current)
          : undefined
        const pageSize = search?.pageSize
          ? Number(search.pageSize)
          : undefined

        return {
          resource,
          action,
          id,
          pathname: location.pathname,
          params: {
            ...params,
            ...search,
            current,
            pageSize,
          },
        }
      }, [params, location, search])
    },

    /**
     * Link component wrapper
     */
    Link: forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
      return <TanStackLink {...props} ref={ref} />
    }),
  }
}
```

### Usage in Refine

```typescript
import { Refine } from '@refinedev/core'
import { createRouterBindings } from '@/libs/refine/tanstack-router-provider'
import { resources } from '@/libs/refine/resources'

// Create router bindings with resources
const routerProvider = createRouterBindings(resources)

function App() {
  return (
    <Refine
      routerProvider={routerProvider}
      resources={resources}
      // ...
    >
      {/* ... */}
    </Refine>
  )
}
```

> **Why factory function?** Avoids global mutable state (`let resourcesRef`). Resources are captured via closure, making the code more predictable and easier to test.

---

## Phase 2: Project Structure Migration

### Current Structure

```
src/
├── components/
├── hooks/
├── libs/
├── pages/                    # Page components
│   ├── prompts/
│   ├── categories/
│   └── ...
└── app.tsx                   # Routes defined here
```

### Target Structure

```
src/
├── actions/                  # Server functions (NEW)
│   ├── auth.ts
│   ├── prompts.ts
│   ├── categories.ts
│   ├── storage.ts
│   └── index.ts
├── components/               # Keep existing
│   ├── ui/
│   ├── forms/
│   └── ...
├── hooks/                    # Keep existing
├── libs/
│   ├── supabase/
│   │   ├── client.ts         # Browser client (anon key)
│   │   ├── server.ts         # Server client (service role key) NEW
│   │   └── index.ts
│   ├── refine/
│   │   ├── data-provider.ts
│   │   ├── auth-provider.ts
│   │   └── tanstack-router-provider.tsx  # NEW
│   └── ...
├── routes/                   # TanStack Router routes (NEW)
│   ├── __root.tsx            # Root layout
│   ├── _authed.tsx           # Protected layout
│   ├── _guest.tsx            # Guest layout
│   ├── index.tsx             # Landing/redirect
│   ├── login.tsx             # Login page
│   ├── _authed/
│   │   ├── prompts/
│   │   │   ├── index.tsx     # List
│   │   │   ├── create.tsx    # Create
│   │   │   ├── $id.edit.tsx  # Edit
│   │   │   └── $id.show.tsx  # Show
│   │   ├── categories/
│   │   ├── tags/
│   │   ├── ai-providers/
│   │   ├── ai-models/
│   │   └── media-library/
│   │       ├── index.tsx     # Bucket list
│   │       └── $bucketId/
│   │           └── $.tsx     # File browser (catch-all for path)
├── schemas/                  # Zod schemas
├── types/                    # TypeScript types
├── router.tsx                # Router configuration
├── routeTree.gen.ts          # Auto-generated route tree
└── app.css                   # Global styles
```

---

## Phase 3: Server-Side Supabase

### Server Client with Service Role Key

```typescript
// src/libs/supabase/server.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

let serverClient: SupabaseClient<Database> | null = null

/**
 * Get Supabase client with service role key (server-only)
 * NEVER expose this to the client
 */
export function getServerSupabase(): SupabaseClient<Database> {
  if (serverClient) return serverClient

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server credentials')
  }

  serverClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return serverClient
}
```

### Server Functions Example

```typescript
// src/actions/storage.ts
import { createServerFn } from '@tanstack/react-start'
import { getServerSupabase } from '@/libs/supabase/server'

/**
 * List all storage buckets (requires service role)
 */
export const listBucketsServer = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = getServerSupabase()
    const { data, error } = await supabase.storage.listBuckets()

    if (error) {
      throw new Error(error.message)
    }

    return data
  })

/**
 * Create a new bucket (requires service role)
 */
export const createBucketServer = createServerFn({ method: 'POST' })
  .validator((data: { name: string; public: boolean }) => data)
  .handler(async ({ data }) => {
    const supabase = getServerSupabase()
    const { data: bucket, error } = await supabase.storage.createBucket(
      data.name,
      { public: data.public }
    )

    if (error) {
      throw new Error(error.message)
    }

    return bucket
  })

/**
 * Delete a bucket (requires service role)
 */
export const deleteBucketServer = createServerFn({ method: 'POST' })
  .validator((data: { bucketId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getServerSupabase()

    // First empty the bucket
    const { data: files } = await supabase.storage
      .from(data.bucketId)
      .list('', { limit: 10000 })

    if (files && files.length > 0) {
      const filePaths = files.map(f => f.name)
      await supabase.storage.from(data.bucketId).remove(filePaths)
    }

    // Then delete the bucket
    const { error } = await supabase.storage.deleteBucket(data.bucketId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  })
```

### Using Server Functions in Components

```typescript
// src/components/dashboard/bucket-list.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listBucketsServer, createBucketServer } from '@/actions/storage'

export function BucketList() {
  const queryClient = useQueryClient()

  // Fetch buckets using server function
  const { data: buckets, isLoading } = useQuery({
    queryKey: ['buckets'],
    queryFn: () => listBucketsServer(),
  })

  // Create bucket mutation
  const createBucket = useMutation({
    mutationFn: createBucketServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buckets'] })
    },
  })

  // ... rest of component
}
```

---

## Phase 4: Route Migration

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
    cloudflare(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
```

### Root Route

```typescript
// src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Refine } from '@refinedev/core'
import { QueryClient } from '@tanstack/react-query'

import { routerBindings, setResources } from '@/libs/refine/tanstack-router-provider'
import { dataProvider } from '@/libs/refine/data-provider'
import { authProvider } from '@/libs/refine/auth-provider'
import { resources } from '@/libs/refine/resources'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

// Set resources for router provider
setResources(resources)

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <ThemeProvider>
      <Refine
        dataProvider={dataProvider}
        authProvider={authProvider}
        routerProvider={routerBindings}
        resources={resources}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
          disableTelemetry: true,
        }}
      >
        <Outlet />
        <Toaster />
      </Refine>

      {/* Dev tools */}
      <ReactQueryDevtools buttonPosition="bottom-left" />
      <TanStackRouterDevtools position="bottom-right" />
    </ThemeProvider>
  )
}
```

### Protected Layout

```typescript
// src/routes/_authed.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Layout } from '@/components/layout'
import { fetchSessionServer } from '@/actions/auth'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const session = await fetchSessionServer()

    if (!session) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.pathname,
        },
      })
    }

    return { session }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}
```

### Example Page Route

```typescript
// src/routes/_authed/prompts/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { PromptsList } from '@/pages/prompts/list'

export const Route = createFileRoute('/_authed/prompts/')({
  component: PromptsList,
})
```

```typescript
// src/routes/_authed/prompts/$id.edit.tsx
import { createFileRoute } from '@tanstack/react-router'
import { PromptsEdit } from '@/pages/prompts/edit'

export const Route = createFileRoute('/_authed/prompts/$id/edit')({
  component: PromptsEdit,
})
```

---

## Phase 5: Data Provider Migration

Since we're moving ALL Supabase operations to server-side, the data provider needs to wrap server functions instead of using a client-side Supabase client.

### Server-Side Data Provider

```typescript
// src/libs/refine/data-provider.ts
import type { DataProvider, BaseRecord, GetListParams, GetOneParams, CreateParams, UpdateParams, DeleteOneParams } from '@refinedev/core'
import { getListServer, getOneServer, createServer, updateServer, deleteOneServer } from '@/actions/crud'

/**
 * Refine Data Provider that delegates ALL operations to server functions
 * No client-side Supabase client needed
 */
export const dataProvider: DataProvider = {
  getList: async <TData extends BaseRecord = BaseRecord>({ resource, pagination, filters, sorters, meta }: GetListParams) => {
    const result = await getListServer({
      data: { resource, pagination, filters, sorters, meta }
    })
    return result as { data: TData[]; total: number }
  },

  getOne: async <TData extends BaseRecord = BaseRecord>({ resource, id, meta }: GetOneParams) => {
    const result = await getOneServer({
      data: { resource, id: String(id), meta }
    })
    return result as { data: TData }
  },

  create: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, variables, meta }: CreateParams<TVariables>) => {
    const result = await createServer({
      data: { resource, variables, meta }
    })
    return result as { data: TData }
  },

  update: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, id, variables, meta }: UpdateParams<TVariables>) => {
    const result = await updateServer({
      data: { resource, id: String(id), variables, meta }
    })
    return result as { data: TData }
  },

  deleteOne: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({ resource, id, meta }: DeleteOneParams<TVariables>) => {
    const result = await deleteOneServer({
      data: { resource, id: String(id), meta }
    })
    return result as { data: TData }
  },

  getApiUrl: () => process.env.VITE_SUPABASE_URL || '',
}
```

### Server Functions for CRUD

```typescript
// src/actions/crud.ts
import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '@/libs/supabase/server'
import type { CrudFilters, CrudSorting, Pagination } from '@refinedev/core'

interface MetaOptions {
  select?: string  // Custom column selection e.g. "*, category:categories(*)"
  [key: string]: unknown
}

interface GetListInput {
  resource: string
  pagination?: Pagination
  filters?: CrudFilters
  sorters?: CrudSorting
  meta?: MetaOptions
}

/**
 * Server-side getList with full Supabase query capabilities
 * Supports meta.select for custom column/relation selection
 */
export const getListServer = createServerFn({ method: 'POST' })
  .validator((data: GetListInput) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { resource, pagination, filters, sorters, meta } = data

    // Use meta.select for custom column selection, default to '*'
    const selectQuery = meta?.select || '*'
    let query = supabase.from(resource).select(selectQuery, { count: 'exact' })

    // Apply pagination
    if (pagination) {
      const { current = 1, pageSize = 10 } = pagination
      const start = (current - 1) * pageSize
      const end = start + pageSize - 1
      query = query.range(start, end)
    }

    // Apply filters
    if (filters) {
      for (const filter of filters) {
        if ('field' in filter && filter.field) {
          const { field, operator, value } = filter
          switch (operator) {
            case 'eq':
              query = query.eq(field, value)
              break
            case 'ne':
              query = query.neq(field, value)
              break
            case 'lt':
              query = query.lt(field, value)
              break
            case 'lte':
              query = query.lte(field, value)
              break
            case 'gt':
              query = query.gt(field, value)
              break
            case 'gte':
              query = query.gte(field, value)
              break
            case 'contains':
              query = query.ilike(field, `%${value}%`)
              break
            case 'in':
              query = query.in(field, value as unknown[])
              break
            case 'null':
              query = value ? query.is(field, null) : query.not(field, 'is', null)
              break
            // Add more operators as needed
          }
        }
      }
    }

    // Apply sorting
    if (sorters && sorters.length > 0) {
      for (const sorter of sorters) {
        query = query.order(sorter.field, { ascending: sorter.order === 'asc' })
      }
    }

    const { data: records, count, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data: records || [], total: count || 0 }
  })

/**
 * Server-side getOne
 * Supports meta.select for custom column/relation selection
 */
export const getOneServer = createServerFn({ method: 'POST' })
  .validator((data: { resource: string; id: string; meta?: MetaOptions }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { resource, id, meta } = data

    const selectQuery = meta?.select || '*'
    const { data: record, error } = await supabase
      .from(resource)
      .select(selectQuery)
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { data: record }
  })

/**
 * Server-side create
 * Supports meta.select for returning specific columns after insert
 */
export const createServer = createServerFn({ method: 'POST' })
  .validator((data: { resource: string; variables: unknown; meta?: MetaOptions }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { resource, variables, meta } = data

    const selectQuery = meta?.select || '*'
    const { data: record, error } = await supabase
      .from(resource)
      .insert(variables as Record<string, unknown>)
      .select(selectQuery)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { data: record }
  })

/**
 * Server-side update
 * Supports meta.select for returning specific columns after update
 */
export const updateServer = createServerFn({ method: 'POST' })
  .validator((data: { resource: string; id: string; variables: unknown; meta?: MetaOptions }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { resource, id, variables, meta } = data

    const selectQuery = meta?.select || '*'
    const { data: record, error } = await supabase
      .from(resource)
      .update(variables as Record<string, unknown>)
      .eq('id', id)
      .select(selectQuery)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { data: record }
  })

/**
 * Server-side deleteOne
 */
export const deleteOneServer = createServerFn({ method: 'POST' })
  .validator((data: { resource: string; id: string; meta?: MetaOptions }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { resource, id, meta } = data

    const selectQuery = meta?.select || '*'
    const { data: record, error } = await supabase
      .from(resource)
      .delete()
      .eq('id', id)
      .select(selectQuery)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { data: record }
  })
```

### Usage with meta.select

```typescript
// Example: Fetch prompts with related category and tags
useTable({
  resource: 'prompts',
  meta: {
    select: '*, category:categories(*), prompt_tags(tag:tags(*))',
  },
})

// Example: Fetch only specific columns
useOne({
  resource: 'prompts',
  id: '123',
  meta: {
    select: 'id, title, content',
  },
})
```

### Custom Logic for Junction Tables

```typescript
// src/actions/prompts.ts
import { createServerFn } from '@tanstack/react-start'
import { getServerSupabase } from '@/libs/supabase/server'

/**
 * Custom getList for prompts with junction table filtering (tags, models)
 * Preserves the complex filtering logic from the current data provider
 */
export const getPromptsListServer = createServerFn({ method: 'POST' })
  .validator((data: {
    pagination?: { current: number; pageSize: number }
    filters?: Array<{ field: string; operator: string; value: unknown }>
    sorters?: Array<{ field: string; order: 'asc' | 'desc' }>
  }) => data)
  .handler(async ({ data }) => {
    const supabase = getServerSupabase()
    const { pagination, filters, sorters } = data

    // Handle junction table filters (tags, models)
    const tagFilter = filters?.find(f => f.field === 'tags')
    const modelFilter = filters?.find(f => f.field === 'models')
    const regularFilters = filters?.filter(f => !['tags', 'models'].includes(f.field))

    let promptIds: string[] | null = null

    // Filter by tags via junction table
    if (tagFilter?.value) {
      const tagIds = Array.isArray(tagFilter.value) ? tagFilter.value : [tagFilter.value]
      const { data: promptTags } = await supabase
        .from('prompt_tags')
        .select('prompt_id')
        .in('tag_id', tagIds)

      promptIds = [...new Set(promptTags?.map(pt => pt.prompt_id) || [])]
    }

    // Filter by models via junction table
    if (modelFilter?.value) {
      const modelIds = Array.isArray(modelFilter.value) ? modelFilter.value : [modelFilter.value]
      const { data: promptModels } = await supabase
        .from('prompt_models')
        .select('prompt_id')
        .in('model_id', modelIds)

      const modelPromptIds = [...new Set(promptModels?.map(pm => pm.prompt_id) || [])]

      // Intersect with tag filter results if both present
      if (promptIds) {
        promptIds = promptIds.filter(id => modelPromptIds.includes(id))
      } else {
        promptIds = modelPromptIds
      }
    }

    // Build main query
    let query = supabase.from('prompts').select('*', { count: 'exact' })

    // Apply junction table filter
    if (promptIds !== null) {
      if (promptIds.length === 0) {
        return { data: [], total: 0 }
      }
      query = query.in('id', promptIds)
    }

    // Apply regular filters
    for (const filter of regularFilters || []) {
      // ... apply filter logic
    }

    // Apply pagination & sorting
    if (pagination) {
      const start = (pagination.current - 1) * pagination.pageSize
      query = query.range(start, start + pagination.pageSize - 1)
    }

    if (sorters) {
      for (const sorter of sorters) {
        query = query.order(sorter.field, { ascending: sorter.order === 'asc' })
      }
    }

    const { data: prompts, count, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data: prompts || [], total: count || 0 }
  })
```

> **Key Change**: All database operations now go through server functions. The client never directly accesses Supabase. This means:
> - No anon key needed in the browser
> - No RLS policies needed (service role bypasses RLS)
> - All queries are type-safe and validated on the server

---

## Phase 6: Auth Provider Migration

Auth uses Supabase's built-in session management with cookies. Following the vouch-ui pattern:
- Server-side client handles session via cookies (TanStack Start cookie API)
- Client-side Supabase ONLY for auth state listeners and OTP flows
- React Query caches session data

### Supabase Clients

```typescript
// src/libs/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

let browserClient: SupabaseClient<Database> | null = null

/**
 * Client-side Supabase - ONLY for auth listeners and OTP
 * All data operations go through server functions
 */
export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient

  browserClient = createBrowserClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      auth: {
        storageKey: 'prompt-valley-auth',
      },
    }
  )

  return browserClient
}
```

```typescript
// src/libs/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import type { Database } from '@/types/database.types'

/**
 * Server-side Supabase with cookie-based session management
 * Uses service role key for data operations
 */
export function getSupabaseServerClient() {
  return createServerClient<Database>(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        storageKey: 'prompt-valley-auth',
      },
      cookies: {
        getAll() {
          return Object.entries(getCookies()).map(([name, value]) => ({
            name,
            value,
          }))
        },
        setAll(cookies) {
          cookies.forEach((cookie) => {
            setCookie(cookie.name, cookie.value)
          })
        },
      },
    }
  )
}
```

### Server-Side Auth Functions

```typescript
// src/actions/auth.ts
import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { Session } from '@supabase/supabase-js'

import { getSupabaseServerClient } from '@/libs/supabase/server'
import { getSupabaseBrowserClient } from '@/libs/supabase/client'

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
}

/**
 * Fetch session from server (validates token expiry)
 */
export const fetchSessionServer = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Session | null> => {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase.auth.getSession()

    if (error || !data.session?.access_token) {
      return null
    }

    // Check token expiry
    if (dayjs.unix(data.session.expires_at!).isBefore(dayjs())) {
      return null
    }

    return data.session
  }
)

/**
 * Sign out on server
 */
export const signOutServer = createServerFn({ method: 'POST' }).handler(async () => {
  const supabase = getSupabaseServerClient()
  await supabase.auth.signOut()
  return { success: true }
})

/**
 * Server-side password login
 */
export const loginWithPasswordServer = createServerFn({ method: 'POST' })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, session: authData.session, user: authData.user }
  })

/**
 * Server-side OAuth (returns redirect URL)
 */
export const oauthLoginServer = createServerFn({ method: 'POST' })
  .validator((data: { provider: 'google' | 'github'; redirectTo: string }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: authData, error } = await supabase.auth.signInWithOAuth({
      provider: data.provider,
      options: { redirectTo: data.redirectTo },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, url: authData.url }
  })

// React Query options
export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: authKeys.session(),
    queryFn: () => fetchSessionServer(),
    staleTime: 1000 * 60 * 5,  // 5 minutes
    gcTime: 1000 * 60 * 30,    // 30 minutes
  })

// Hooks
export function useSession() {
  return useQuery(sessionQueryOptions())
}

export function useIsAuthenticated() {
  const { data, isLoading } = useSession()
  return { isAuthenticated: !!data, isLoading }
}
```

### Client-Side OTP Functions

OTP requires client-side Supabase for the browser-based flow:

```typescript
// src/actions/auth.ts (continued)
import type { SignInWithPasswordlessCredentials, VerifyOtpParams } from '@supabase/supabase-js'

/**
 * Send OTP to email (client-side only)
 */
export async function sendOTP(email: string): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  })
  if (error) throw error
}

/**
 * Verify OTP code (client-side only)
 */
export async function verifyOTP(email: string, token: string): Promise<Session> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })
  if (error) throw error
  if (!data.session) throw new Error('No session returned')
  return data.session
}
```

### Auth State Listener

Syncs Supabase auth state changes to React Query cache:

```typescript
// src/libs/supabase/auth-state-listener.tsx
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/libs/supabase/client'
import { authKeys } from '@/actions/auth'

const forcedLogoutErrorCodes = [
  'bad_jwt',
  'session_expired',
  'session_not_found',
  'refresh_token_not_found',
]

export function AuthStateListener() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const supabase = getSupabaseBrowserClient()
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (import.meta.env.DEV) {
        console.log('[Auth] State changed:', event)
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        queryClient.setQueryData(authKeys.session(), session)
      } else if (event === 'SIGNED_OUT') {
        queryClient.setQueryData(authKeys.session(), null)
        void queryClient.invalidateQueries()
      }
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [queryClient])

  return null
}
```

### Refine Auth Provider

```typescript
// src/libs/refine/auth-provider.ts
import type { AuthProvider } from '@refinedev/core'
import {
  fetchSessionServer,
  signOutServer,
  loginWithPasswordServer,
  oauthLoginServer,
  sendOTP,
  verifyOTP,
} from '@/actions/auth'

export const authProvider: AuthProvider = {
  login: async ({ email, password, providerName, otp }) => {
    // OAuth login
    if (providerName === 'google' || providerName === 'github') {
      const result = await oauthLoginServer({
        data: {
          provider: providerName,
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (result.success && result.url) {
        window.location.href = result.url
        return { success: true }
      }

      return {
        success: false,
        error: { message: result.error || 'OAuth failed', name: 'OAuthError' },
      }
    }

    // OTP verification
    if (otp) {
      try {
        await verifyOTP(email, otp)
        return { success: true, redirectTo: '/' }
      } catch (error: any) {
        return {
          success: false,
          error: { message: error.message, name: 'OTPError' },
        }
      }
    }

    // Password login
    const result = await loginWithPasswordServer({ data: { email, password } })

    if (!result.success) {
      return {
        success: false,
        error: { message: result.error || 'Login failed', name: 'LoginError' },
      }
    }

    return { success: true, redirectTo: '/' }
  },

  // Custom method to send OTP (called before login with otp)
  forgotPassword: async ({ email }) => {
    try {
      await sendOTP(email)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.message, name: 'OTPSendError' },
      }
    }
  },

  logout: async () => {
    await signOutServer()
    return { success: true, redirectTo: '/login' }
  },

  check: async () => {
    const session = await fetchSessionServer()

    if (session) {
      return { authenticated: true }
    }

    return {
      authenticated: false,
      redirectTo: '/login',
    }
  },

  getIdentity: async () => {
    const session = await fetchSessionServer()

    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name,
        avatar: session.user.user_metadata?.avatar_url,
      }
    }

    return null
  },

  onError: async (error) => {
    if (error?.status === 401) {
      return { logout: true }
    }
    return { error }
  },
}
```

### Root Route with Auth

```typescript
// src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { sessionQueryOptions } from '@/actions/auth'

export type RouterContext = {
  queryClient: QueryClient
  session: Session | null
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    // Fetch session at root level
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions())
    return { session }
  },
  component: RootComponent,
})
```

### Router with Auth Listener

```typescript
// src/router.tsx
import { createRouter } from '@tanstack/react-router'
import { AuthStateListener } from '@/libs/supabase/auth-state-listener'

export const getRouter = () => {
  const router = createRouter({
    context: {
      queryClient,
      session: null,
    },
    Wrap: ({ children }) => (
      <ReactQueryProvider>
        <AuthStateListener />
        {children}
      </ReactQueryProvider>
    ),
  })

  return router
}
```

---

## Phase 7: Testing & Deployment

### Local Development

```bash
# Start development server
pnpm dev

# Type check
pnpm type:check

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Cloudflare Deployment

```jsonc
// wrangler.jsonc
{
  "name": "prompt-valley-cms",
  "compatibility_date": "2024-01-01",
  "main": "./dist/_worker.js",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS"
  },
  "vars": {
    "VITE_SUPABASE_URL": "https://xxx.supabase.co"
  },
  // Secrets set via wrangler secret put
  // SUPABASE_SERVICE_ROLE_KEY
}
```

```bash
# Deploy to Cloudflare Workers
pnpm deploy

# Set secrets
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

### Testing Checklist

- [ ] All routes render correctly
- [ ] Authentication flow works
- [ ] Protected routes redirect properly
- [ ] CRUD operations work for all resources
- [ ] File uploads work
- [ ] Real-time subscriptions work (if used)
- [ ] No client-side errors in console
- [ ] Service role key is NOT exposed in client bundle

---

## Rollback Plan

If issues arise during migration:

1. **Keep the old codebase in a separate branch** (`main-react-router`)
2. **Incremental migration**: Migrate one resource at a time
3. **Feature flags**: Use environment variables to toggle between old/new implementations
4. **Parallel deployment**: Run both versions temporarily

---

## References

### Official Documentation

- [TanStack Start Documentation](https://tanstack.com/start/latest)
- [TanStack Router Documentation](https://tanstack.com/router/latest)
- [Refine Router Provider](https://refine.dev/docs/routing/router-provider/)
- [Refine Routing Guide](https://refine.dev/docs/guides-concepts/routing/)

### GitHub Discussions

- [TanStack Router Integration Discussion](https://github.com/refinedev/refine/discussions/6846)
- [TanStack Router Support Issue](https://github.com/refinedev/refine/issues/5708)

### Source Code References

- [Refine React Router Bindings](https://github.com/refinedev/refine/blob/master/packages/react-router-v6/src/bindings.tsx)
- [vouch-ui (Reference Implementation)](../vouch/vouch-ui)

---

## Migration Timeline

| Phase | Description | Est. Effort |
|-------|-------------|-------------|
| 1 | Custom Router Provider | 1-2 days |
| 2 | Project Restructure | 1 day |
| 3 | Server-Side Supabase | 1-2 days |
| 4 | Route Migration | 2-3 days |
| 5 | Data Provider Migration | 1 day |
| 6 | Auth Provider Migration | 1 day |
| 7 | Testing & Deployment | 2-3 days |
| **Total** | | **9-14 days** |

---

## Notes

- Keep existing component code as-is when possible
- Focus on infrastructure changes first
- Test each phase before moving to the next
- Document any Refine-specific workarounds needed

---

## CRITICAL GAPS & POTENTIAL ISSUES

After thorough review of the codebase, here are the critical issues that may cause problems during migration:

### 1. UnsavedChangesNotifier Migration

**Risk Level**: LOW (Updated - TanStack Router HAS useBlocker!)

The current `UnsavedChangesNotifier` uses React Router's `useBlocker`. Good news: TanStack Router also has `useBlocker`!

**References**:
- https://tanstack.com/router/v1/docs/framework/react/api/router/useBlockerHook
- https://tanstack.com/router/v1/docs/framework/react/guide/navigation-blocking

```typescript
// TanStack Router useBlocker - similar API to React Router
import { useBlocker } from '@tanstack/react-router'

function UnsavedChangesNotifier({ isDirty }: { isDirty: boolean }) {
  useBlocker({
    shouldBlockFn: () => isDirty,
    withResolver: true,
  })

  // ... rest of implementation
}
```

**Solution**: Migrate to TanStack Router's `useBlocker` with minimal changes. The API is similar but check for any differences in the resolver pattern.

---

### 3. Router Provider Hook Context Issues

**Risk Level**: HIGH

The custom `routerBindings` implementation calls hooks (`useNavigate`, `useParams`, `useLocation`, `useSearch`) inside the `go`, `back`, and `parse` function factories. This works in React Router but may have different behavior in TanStack Router's context.

**Concern**: TanStack Router hooks may not be available in the same context where Refine expects them.

**Solution**: Extensive testing required. May need to refactor to use TanStack Router's router instance directly instead of hooks.

---

### 4. NavigateToResource Component Missing

**Risk Level**: MEDIUM

The current app uses `NavigateToResource` from `@refinedev/react-router`:

```typescript
// Current usage
import { NavigateToResource } from '@refinedev/react-router'

<Route index element={<NavigateToResource resource="prompts" />} />
```

**Solution**: Create custom implementation:

```typescript
// Custom NavigateToResource for TanStack Router
function NavigateToResource({ resource }: { resource: string }) {
  const navigate = useNavigate()
  const { resources } = useRefineContext()

  useEffect(() => {
    const res = resources.find(r => r.name === resource)
    if (res?.list) {
      navigate({ to: res.list as string })
    }
  }, [resource])

  return null
}
```

---

### 5. Custom Data Provider Junction Table Logic

**Risk Level**: MEDIUM

The data provider has custom `getList` logic for junction tables (prompts with tags/models):

```typescript
// From data-provider.ts - Custom filtering for prompts
if (resource === 'prompts' && filters) {
  // Complex junction table filtering logic
  // This relies on client-side Supabase queries
}
```

**Solution**: This logic must be preserved. Consider moving complex queries to server functions for better performance and security.

---

### 6. Auth Provider OAuth Redirects

**Risk Level**: MEDIUM

The auth provider uses `window.location.origin` for OAuth redirects:

```typescript
// Current implementation
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

**Problem**: `window` is not available during SSR.

**Solution**:
- Use environment variables for base URL
- Or wrap OAuth logic in client-only execution
- TanStack Start may provide request context with origin

---

### 7. Refine Hooks in SSR Context

**Risk Level**: HIGH

Multiple pages use Refine hooks that expect client-side context:

- `useTable` - Used in all list pages
- `useSelect` - Used in forms for dropdowns
- `useForm` - Used in create/edit pages
- `useList` - Used in dashboards
- `useOne` - Used in show/edit pages
- `useNavigation` - Used for programmatic navigation

**Problem**: These hooks are designed for CSR. Running them in SSR `beforeLoad` may cause hydration mismatches or errors.

**Solution Options**:
1. **Client-only rendering**: Use TanStack Start's client boundaries for all Refine-powered pages
2. **Hybrid approach**: Fetch initial data in `beforeLoad` with server functions, then hydrate Refine hooks on client
3. **Full rewrite**: Replace Refine hooks with TanStack Query + server functions (defeats purpose of using Refine)

---

### 8. Media Library Implementation

**Risk Level**: LOW

The Media Library (`file-browser.tsx`, `bucket-list.tsx`) doesn't use Refine's data provider - it directly calls Supabase Storage API. This is actually easier to migrate since it can use server functions directly.

**No special handling needed** - just convert to server functions.

---

### 9. TanStack Router Type Safety with Refine

**Risk Level**: MEDIUM

TanStack Router has strict type inference for routes. Refine's dynamic resource routing (`/:resource/:action/:id`) conflicts with this.

**Problem**: Refine expects routes like `/prompts/edit/123` but TanStack Router wants explicit route definitions for type safety.

**Solution**: Define all routes explicitly in the file structure. Lose some of Refine's automatic routing but gain type safety.

---

## Risk Assessment Summary

| Component | Risk | Effort | Can It Break? |
|-----------|------|--------|---------------|
| Router Provider Bindings | MEDIUM | Medium | Possible - needs testing |
| UnsavedChangesNotifier | LOW | Low | No - TanStack has useBlocker |
| Refine Hooks (useTable, etc.) | HIGH | Very High | Yes - all pages |
| Auth Provider | LOW | Medium | No - Supabase cookie session |
| NavigateToResource | LOW | Low | No - simple implementation |
| Data Provider | LOW | High | No - fully server-side now |
| Media Library | LOW | Low | No - already direct API |

**Updated Assessment**: Moving to fully server-side Supabase significantly reduces risk. LiveProvider removed (not used). The main remaining concern is Refine hooks in SSR context.

---

## Recommended Phased Approach

Given the risks, here's the safest migration path:

### Phase 0: Proof of Concept (Before Full Migration)
1. Create a minimal TanStack Start app with Refine
2. Test ONE resource (e.g., categories - simplest CRUD)
3. Verify all Refine hooks work correctly
4. Test auth flow including OAuth
5. **If this fails, reconsider the migration**

### Phase 1: Parallel Development
- Keep current app running
- Build TanStack Start version alongside
- Share components via package (monorepo)

### Phase 2: Feature Parity
- Migrate one resource at a time
- Test thoroughly before moving to next
- Keep rollback capability

### Phase 3: Cutover
- Only after ALL features work
- Plan for quick rollback if needed

---

## Conclusion

**Updated Assessment**: The migration is now more feasible with these key changes:

1. **TanStack Router has `useBlocker`** - UnsavedChangesNotifier migration is straightforward
2. **Fully server-side Supabase** - Eliminates RLS complexity, no client credentials exposed
3. **Factory function for router bindings** - Clean, testable implementation

**Remaining Concern**: Refine hooks (useTable, useForm, etc.) are designed for CSR. In SSR context, they may cause hydration mismatches. This is the main area requiring testing.

**Recommendation**: Build a proof-of-concept with one resource (e.g., categories) to validate:
1. Router bindings work correctly with Refine
2. Server functions integrate properly with Refine's data provider
3. Refine hooks hydrate correctly after SSR

If the POC succeeds, the full migration should be relatively smooth. The architecture is now simpler and more secure than the original plan.
