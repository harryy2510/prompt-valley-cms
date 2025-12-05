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
│  ├── Supabase Client (anon key) ── RLS protected       │
│  └── React Query (client state)                         │
└───────────────────────────────────────│─────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
                    ▼                                       ▼
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│   TanStack Start Server         │  │         Supabase                │
│   (Cloudflare Workers)          │  │                                 │
│   ├── Server Functions          │  │  ├── Database (Postgres)       │
│   ├── Supabase Admin Client ────┼──┼──┤  ├── Auth                    │
│   │   (service role key)        │  │  │  ├── Storage                 │
│   └── SSR Rendering             │  │  │  └── Realtime                │
└─────────────────────────────────┘  └─────────────────────────────────┘
```

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
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...              # Client-side (public)
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # Server-side only (secret)

# .env.production
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # Set in deployment platform
```

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
import { matchResourceFromRoute, type RouterProvider } from '@refinedev/core'
import qs from 'qs'

// Store resources reference for parse function
let resourcesRef: any[] = []

export const setResources = (resources: any[]) => {
  resourcesRef = resources
}

/**
 * Custom TanStack Router provider for Refine
 * Implements: go, back, parse, Link
 */
export const routerBindings: RouterProvider = {
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
    const navigate = useNavigate()

    return useCallback(() => {
      window.history.back()
    }, [navigate])
  },

  /**
   * Parse current route to extract resource, action, id, and params
   */
  parse: () => {
    const params = useParams({ strict: false })
    const location = useLocation()
    const search = useSearch({ strict: false }) as Record<string, unknown>

    return useCallback(() => {
      // Match resource from route
      const { resource, action, matchedRoute } = matchResourceFromRoute(
        location.pathname,
        resourcesRef,
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
```

### Usage in Refine

```typescript
import { Refine } from '@refinedev/core'
import { routerBindings, setResources } from '@/libs/refine/tanstack-router-provider'

const resources = [
  { name: 'prompts', list: '/prompts', /* ... */ },
  // ...
]

// Set resources for parse function
setResources(resources)

function App() {
  return (
    <Refine
      routerProvider={routerBindings}
      resources={resources}
      // ...
    >
      {/* ... */}
    </Refine>
  )
}
```

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

The Refine data provider can remain mostly unchanged, but consider moving sensitive operations to server functions.

### Hybrid Approach

```typescript
// src/libs/refine/data-provider.ts
import { dataProvider as supabaseDataProvider } from '@refinedev/supabase'
import { supabase } from '@/libs/supabase/client'
import type { DataProvider } from '@refinedev/core'

// Base provider using client-side Supabase (with RLS)
const baseProvider = supabaseDataProvider(supabase)

// Custom data provider with server-side overrides
export const dataProvider: DataProvider = {
  ...baseProvider,

  // Override specific methods to use server functions if needed
  // For example, if you need admin-level access for certain resources

  // Most operations can still use client-side with RLS
  getList: baseProvider.getList,
  getOne: baseProvider.getOne,
  create: baseProvider.create,
  update: baseProvider.update,
  deleteOne: baseProvider.deleteOne,
}
```

---

## Phase 6: Auth Provider Migration

```typescript
// src/libs/refine/auth-provider.ts
import type { AuthProvider } from '@refinedev/core'
import { supabase } from '@/libs/supabase/client'
import { fetchSessionServer, signOutServer } from '@/actions/auth'

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: { message: error.message, name: 'LoginError' },
      }
    }

    return { success: true, redirectTo: '/' }
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
        name: session.user.user_metadata?.name,
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
