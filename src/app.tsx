import { Refine } from '@refinedev/core'
import { liveProvider } from '@refinedev/supabase'
import routerProvider, {
  NavigateToResource,
  UnsavedChangesNotifier,
} from '@refinedev/react-router'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router'
import { ErrorComponent } from '@/components/refine-ui/layout/error-component'

import { supabase } from '@/libs/supabase'
import { dataProvider } from '@/libs/data-provider'
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
import { BucketList, FileBrowser } from './pages/media-library'
import { Layout } from '@/components/refine-ui/layout/layout'
import { ThemeProvider } from '@/components/refine-ui/theme/theme-provider'
import {
  Bot,
  Database,
  FileText,
  FolderOpen,
  FolderTree,
  Package,
  Tags,
} from 'lucide-react'

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Refine
          dataProvider={dataProvider}
          liveProvider={liveProvider(supabase)}
          routerProvider={routerProvider}
          authProvider={authProvider}
          notificationProvider={useNotificationProvider}
          resources={[
            {
              name: 'content',
              meta: {
                label: 'Content',
                icon: <Database />,
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
                parent: 'content',
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
                parent: 'content',
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
                parent: 'content',
              },
            },
            {
              name: 'ai_providers',
              list: '/ai-providers',
              create: '/ai-providers/create',
              edit: '/ai-providers/edit/:id',
              meta: {
                label: 'AI Providers',
                icon: <Bot />,
                parent: 'content',
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
                parent: 'content',
              },
            },
            {
              name: 'media-library',
              list: '/media-library',
              meta: {
                label: 'Media Library',
                icon: <FolderOpen />,
              },
            },
          ]}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
            mutationMode: 'pessimistic',
            disableTelemetry: true,
            title: {
              icon: <LogoWithText className="h-8 w-auto" />,
              text: '',
            },
            reactQuery: {
              clientConfig: {
                defaultOptions: {
                  queries: {
                    retry: false,
                  },
                },
              },
            },
          }}
        >
          <Routes>
            {/* Login Route - Outside AppLayout */}
            <Route
              path="/login"
              element={
                <AuthGuard mode="guest">
                  <LoginPage />
                </AuthGuard>
              }
            />

            <Route
              element={
                <AuthGuard mode="protected">
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

              {/* Media Library */}
              <Route path="/media-library">
                <Route index element={<BucketList />} />
                <Route path=":bucketId" element={<FileBrowser />} />
              </Route>
            </Route>

            <Route path="*" element={<ErrorComponent />} />
          </Routes>
          <UnsavedChangesNotifier />
        </Refine>
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  )
}
