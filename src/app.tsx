import { Refine } from '@refinedev/core'
import { dataProvider, liveProvider } from '@refinedev/supabase'
import routerProvider, { NavigateToResource } from '@refinedev/react-router'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { supabase } from '@/libs/supabase'
import { AppLayout } from './components/layout'
import { ThemeProvider } from './components/theme-provider'
import { AuthGuard } from './components/auth-guard'

const queryClient = new QueryClient()

// Pages
import { LoginPage } from './pages/login'
import { DashboardPage } from './pages/dashboard'
import {
  AiProvidersList,
  AiProvidersCreate,
  AiProvidersEdit,
} from './pages/ai-providers'
import { AiModelsList, AiModelsCreate, AiModelsEdit } from './pages/ai-models'
import {
  CategoriesList,
  CategoriesCreate,
  CategoriesEdit,
} from './pages/categories'
import { TagsList, TagsCreate, TagsEdit } from './pages/tags'
import {
  PromptsList,
  PromptsCreate,
  PromptsEdit,
  PromptsShow,
} from './pages/prompts'
import { Toaster } from '@/components/ui/sonner'

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="promptvalley-theme">
        <QueryClientProvider client={queryClient}>
          <Refine
            dataProvider={dataProvider(supabase)}
            liveProvider={liveProvider(supabase)}
            routerProvider={routerProvider}
            resources={[
              {
                name: 'ai_providers',
                list: '/ai-providers',
                create: '/ai-providers/create',
                edit: '/ai-providers/edit/:id',
                meta: {
                  label: 'AI Providers',
                },
              },
              {
                name: 'ai_models',
                list: '/ai-models',
                create: '/ai-models/create',
                edit: '/ai-models/edit/:id',
                meta: {
                  label: 'AI Models',
                },
              },
              {
                name: 'categories',
                list: '/categories',
                create: '/categories/create',
                edit: '/categories/edit/:id',
                meta: {
                  label: 'Categories',
                },
              },
              {
                name: 'tags',
                list: '/tags',
                create: '/tags/create',
                edit: '/tags/edit/:id',
                meta: {
                  label: 'Tags',
                },
              },
              {
                name: 'prompts',
                list: '/prompts',
                create: '/prompts/create',
                edit: '/prompts/edit/:id',
                show: '/prompts/show/:id',
                meta: {
                  label: 'Prompts',
                },
              },
            ]}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
              mutationMode: 'optimistic',
              disableTelemetry: true,
            }}
          >
            <Routes>
              {/* Login Route - Outside AppLayout */}
              <Route
                path="/login"
                element={
                  <AuthGuard requireAuth={false}>
                    <LoginPage />
                  </AuthGuard>
                }
              />

              <Route
                element={
                  <AuthGuard requireAuth>
                    <AppLayout>
                      <Outlet />
                    </AppLayout>
                  </AuthGuard>
                }
              >
                <Route
                  index
                  element={<NavigateToResource resource="dashboard" />}
                />
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* AI Providers */}
                <Route path="/ai-providers">
                  <Route index element={<AiProvidersList />} />
                  <Route path="create" element={<AiProvidersCreate />} />
                  <Route path="edit/:id" element={<AiProvidersEdit />} />
                </Route>

                {/* AI Models */}
                <Route path="/ai-models">
                  <Route index element={<AiModelsList />} />
                  <Route path="create" element={<AiModelsCreate />} />
                  <Route path="edit/:id" element={<AiModelsEdit />} />
                </Route>

                {/* Categories */}
                <Route path="/categories">
                  <Route index element={<CategoriesList />} />
                  <Route path="create" element={<CategoriesCreate />} />
                  <Route path="edit/:id" element={<CategoriesEdit />} />
                </Route>

                {/* Tags */}
                <Route path="/tags">
                  <Route index element={<TagsList />} />
                  <Route path="create" element={<TagsCreate />} />
                  <Route path="edit/:id" element={<TagsEdit />} />
                </Route>

                {/* Prompts */}
                <Route path="/prompts">
                  <Route index element={<PromptsList />} />
                  <Route path="create" element={<PromptsCreate />} />
                  <Route path="edit/:id" element={<PromptsEdit />} />
                  <Route path="show/:id" element={<PromptsShow />} />
                </Route>
              </Route>
            </Routes>
          </Refine>
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
