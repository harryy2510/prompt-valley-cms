import { Refine } from '@refinedev/core'
import { dataProvider, liveProvider } from '@refinedev/supabase'
import routerProvider, { NavigateToResource } from '@refinedev/react-router'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router'
import { ErrorComponent } from '@/components/refine-ui/layout/error-component'

import { supabase } from '@/libs/supabase'
import { authProvider } from '@/libs/auth-provider'
import { LogoWithText } from './components/logo-with-text'
import { AuthGuard } from './components/auth-guard'
import { useNotificationProvider } from '@/components/refine-ui/notification/use-notification-provider'
import { Toaster } from '@/components/refine-ui/notification/toaster'

import { LoginPage } from './pages/login'
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
import { Layout } from '@/components/refine-ui/layout/layout'
import { ThemeProvider } from '@/components/refine-ui/theme/theme-provider'
import { Bot, FileText, FolderTree, Package, Tags } from 'lucide-react'

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Refine
          dataProvider={dataProvider(supabase)}
          liveProvider={liveProvider(supabase)}
          routerProvider={routerProvider}
          authProvider={authProvider}
          notificationProvider={useNotificationProvider}
          resources={[
            {
              name: 'ai_providers',
              list: '/ai-providers',
              create: '/ai-providers/create',
              edit: '/ai-providers/edit/:id',
              meta: {
                label: 'AI Providers',
                icon: <Bot />,
              },
            },
            {
              name: 'ai_models',
              list: '/ai-models',
              create: '/ai-models/create',
              edit: '/ai-models/edit/:id',
              meta: {
                label: 'AI Models',
                icon: <Package />,
              },
            },
            {
              name: 'categories',
              list: '/categories',
              create: '/categories/create',
              edit: '/categories/edit/:id',
              meta: {
                label: 'Categories',
                icon: <FolderTree />,
              },
            },
            {
              name: 'tags',
              list: '/tags',
              create: '/tags/create',
              edit: '/tags/edit/:id',
              meta: {
                label: 'Tags',
                icon: <Tags />,
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
                icon: <FileText />,
              },
            },
          ]}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
            mutationMode: 'optimistic',
            disableTelemetry: true,
            title: {
              icon: <LogoWithText className="h-8 w-auto" />,
              text: '',
            },
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
                  <Layout>
                    <Outlet />
                  </Layout>
                </AuthGuard>
              }
            >
              <Route
                index
                element={<NavigateToResource resource="prompts" />}
              />

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

            <Route path="*" element={<ErrorComponent />} />
          </Routes>
        </Refine>
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  )
}
