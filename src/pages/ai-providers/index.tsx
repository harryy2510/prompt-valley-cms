import {
  useList,
  useNavigation,
  useCreate,
  useUpdate,
  useOne,
  useDelete,
} from '@refinedev/core'
import { useParams } from 'react-router'
import { useState, useEffect } from 'react'
import { ExternalLink, Pencil, Trash2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  PageHeader,
  DataTableWrapper,
  FormPageLayout,
  FormCard,
} from '@/components/page-layout'
import { getImageUrl } from '@/libs/storage'

export function AiProvidersList() {
  const { query } = useList({
    resource: 'ai_providers',
    queryOptions: {
      retry: 1,
    },
  })

  const { data, isLoading, refetch } = query
  const { create, edit } = useNavigation()
  const { mutate: deleteProvider } = useDelete()
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    id: string
    name: string
  } | null>(null)

  const handleDelete = () => {
    if (!deleteDialog) return
    deleteProvider(
      {
        resource: 'ai_providers',
        id: deleteDialog.id,
      },
      {
        onSuccess: () => {
          refetch()
          setDeleteDialog(null)
        },
      },
    )
  }

  return (
    <div className="mx-auto w-full">
      <PageHeader
        title="AI Providers"
        description="Manage AI service providers and their configurations"
        action={{
          label: 'Add Provider',
          onClick: () => create('ai_providers'),
        }}
      />

      <DataTableWrapper isLoading={isLoading}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Website</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data?.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <Plus className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">No providers yet</p>
                      <p className="text-xs">
                        Get started by adding your first AI provider
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((provider: any) => {
                const logoUrl = getImageUrl(provider.logo_url)
                return (
                  <TableRow key={provider.id}>
                    <TableCell>
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={provider.name}
                          className="size-8 rounded border object-contain p-1"
                        />
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded border bg-muted text-xs font-medium">
                          {provider.name.charAt(0)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{provider.name}</div>
                    </TableCell>
                    <TableCell>
                      {provider.website_url ? (
                        <a
                          href={provider.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="size-3" />
                          <span>Visit site</span>
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => edit('ai_providers', provider.id)}
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              id: provider.id,
                              name: provider.name,
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </DataTableWrapper>

      <AlertDialog
        open={deleteDialog?.open}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Provider</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function AiProvidersCreate() {
  const { mutate: create } = useCreate()
  const { list } = useNavigation()
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    logo_url: '',
    website_url: '',
  })
  const [autoSlug, setAutoSlug] = useState(true)

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name })
    if (autoSlug) {
      setFormData({ ...formData, name, id: generateSlug(name) })
    }
  }

  const handleIdChange = (id: string) => {
    setFormData({ ...formData, id })
    setAutoSlug(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    create(
      {
        resource: 'ai_providers',
        values: formData,
      },
      {
        onSuccess: () => {
          list('ai_providers')
        },
      },
    )
  }

  const previewUrl = getImageUrl(formData.logo_url)

  return (
    <FormPageLayout
      title="Create AI Provider"
      description="Add a new AI service provider to the system"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormCard
          title="Provider Information"
          description="Enter the basic information for the AI provider"
        >
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Provider Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. OpenAI, Anthropic, Google"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id">
                Provider ID *
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (auto-generated)
                </span>
              </Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => handleIdChange(e.target.value)}
                placeholder="e.g. openai, anthropic"
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier used in the system. Auto-generated from name
                but can be customized.
              </p>
            </div>
          </div>
        </FormCard>

        <FormCard
          title="Branding & Links"
          description="Optional logo and website information"
        >
          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo Path (in content-bucket)</Label>
            <Input
              id="logo_url"
              value={formData.logo_url}
              onChange={(e) =>
                setFormData({ ...formData, logo_url: e.target.value })
              }
              placeholder="logos/openai.png"
            />
            {previewUrl && (
              <div className="flex items-center gap-3 rounded-md border p-3">
                <img
                  src={previewUrl}
                  alt="Logo preview"
                  className="size-12 rounded border object-contain p-1"
                />
                <p className="text-xs text-muted-foreground">Logo preview</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              id="website_url"
              type="url"
              value={formData.website_url}
              onChange={(e) =>
                setFormData({ ...formData, website_url: e.target.value })
              }
              placeholder="https://example.com"
            />
          </div>
        </FormCard>

        <div className="flex items-center gap-2">
          <Button type="submit">Create Provider</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => list('ai_providers')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </FormPageLayout>
  )
}

export function AiProvidersEdit() {
  const { id } = useParams()
  const { data, isLoading } = useOne({ resource: 'ai_providers', id: id || '' })
  const { mutate: update } = useUpdate()
  const { list } = useNavigation()
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    website_url: '',
  })

  useEffect(() => {
    if (data?.data) {
      setFormData({
        name: data.data.name || '',
        logo_url: data.data.logo_url || '',
        website_url: data.data.website_url || '',
      })
    }
  }, [data])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    update(
      {
        resource: 'ai_providers',
        id: id || '',
        values: formData,
      },
      {
        onSuccess: () => {
          list('ai_providers')
        },
      },
    )
  }

  const previewUrl = getImageUrl(formData.logo_url)

  return (
    <FormPageLayout
      title="Edit AI Provider"
      description="Update provider information"
      isLoading={isLoading}
    >
      {!isLoading && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormCard
            title="Provider Information"
            description="Update the basic information for the AI provider"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Provider Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. OpenAI, Anthropic, Google"
                required
              />
            </div>
          </FormCard>

          <FormCard
            title="Branding & Links"
            description="Optional logo and website information"
          >
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo Path (in content-bucket)</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) =>
                  setFormData({ ...formData, logo_url: e.target.value })
                }
                placeholder="logos/openai.png"
              />
              {previewUrl && (
                <div className="flex items-center gap-3 rounded-md border p-3">
                  <img
                    src={previewUrl}
                    alt="Logo preview"
                    className="size-12 rounded border object-contain p-1"
                  />
                  <p className="text-xs text-muted-foreground">Logo preview</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) =>
                  setFormData({ ...formData, website_url: e.target.value })
                }
                placeholder="https://example.com"
              />
            </div>
          </FormCard>

          <div className="flex items-center gap-2">
            <Button type="submit">Save Changes</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => list('ai_providers')}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </FormPageLayout>
  )
}
