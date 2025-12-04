import {
  useList,
  useNavigation,
  useOne,
  useCreate,
  useUpdate,
  useDelete,
} from '@refinedev/core'
import { useParams } from 'react-router'
import { useState, useEffect } from 'react'
import { Pencil, Trash2, Plus, Eye, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { supabase } from '@/libs/supabase'

export function PromptsList() {
  const { result, query } = useList({
    resource: 'prompts',
    queryOptions: {
      retry: 1,
    },
  })

  const { data, isLoading, refetch } = query
  const { create, edit, show } = useNavigation()
  const { mutate: deletePrompt } = useDelete()
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    id: string
    title: string
  } | null>(null)

  const handleDelete = () => {
    if (!deleteDialog) return
    deletePrompt(
      {
        resource: 'prompts',
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
        title="Prompts"
        description="Manage your prompt library and content"
        action={{
          label: 'Add Prompt',
          onClick: () => create('prompts'),
        }}
      />

      <DataTableWrapper isLoading={isLoading}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-[100px]">Tier</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[80px]">Views</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result?.data?.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <Plus className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">No prompts yet</p>
                      <p className="text-xs">
                        Create your first prompt to get started
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              result?.data?.map((prompt: any) => (
                <TableRow key={prompt.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{prompt.title}</div>
                      {prompt.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {prompt.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{prompt.category_id || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={prompt.tier === 'pro' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {prompt.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={prompt.is_published ? 'default' : 'outline'}
                      className={
                        prompt.is_published
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : ''
                      }
                    >
                      {prompt.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm tabular-nums">
                      {prompt.views_count || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => show('prompts', prompt.id)}
                      >
                        <Eye className="size-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => edit('prompts', prompt.id)}
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
                            id: prompt.id,
                            title: prompt.title,
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
            <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog?.title}&quot;?
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

export function PromptsCreate() {
  const { mutate: create } = useCreate()
  const { list } = useNavigation()
  const { result: categoriesResult } = useList({ resource: 'categories' })
  const { result: tagsResult } = useList({ resource: 'tags' })
  const { result: modelsResult } = useList({ resource: 'ai_models' })

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    content: '',
    category_id: '',
    tier: 'free' as 'free' | 'pro',
    is_published: false,
    is_featured: false,
    images: [] as string[],
  })
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [imageInput, setImageInput] = useState('')
  const [autoSlug, setAutoSlug] = useState(true)

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title })
    if (autoSlug) {
      setFormData({ ...formData, title, id: generateSlug(title) })
    }
  }

  const handleIdChange = (id: string) => {
    setFormData({ ...formData, id })
    setAutoSlug(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Create prompt first
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .insert(formData)
      .select()
      .single()

    if (promptError) {
      console.error('Error creating prompt:', promptError)
      return
    }

    // Insert tag relations
    if (selectedTags.length > 0) {
      const tagRelations = selectedTags.map((tagId) => ({
        prompt_id: formData.id,
        tag_id: tagId,
      }))
      await supabase.from('prompt_tags').insert(tagRelations)
    }

    // Insert model relations
    if (selectedModels.length > 0) {
      const modelRelations = selectedModels.map((modelId) => ({
        prompt_id: formData.id,
        model_id: modelId,
      }))
      await supabase.from('prompt_models').insert(modelRelations)
    }

    list('prompts')
  }

  const addImage = () => {
    if (imageInput.trim() && !formData.images.includes(imageInput.trim())) {
      setFormData({
        ...formData,
        images: [...formData.images, imageInput.trim()],
      })
      setImageInput('')
    }
  }

  const removeImage = (image: string) => {
    setFormData({
      ...formData,
      images: formData.images.filter((img) => img !== image),
    })
  }

  return (
    <FormPageLayout
      title="Create Prompt"
      description="Add a new prompt to your library"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormCard
          title="Prompt Details"
          description="Enter the information for the new prompt"
        >
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Write a compelling product description"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id">
                ID (slug) *
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (auto-generated)
                </span>
              </Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => handleIdChange(e.target.value)}
                placeholder="write-compelling-product-description"
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated from title. You can edit it manually.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of what this prompt does"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Prompt Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Enter the full prompt content here..."
                rows={8}
                required
              />
            </div>
          </div>
        </FormCard>

        <FormCard
          title="Content Settings"
          description="Configure category, tier, and publishing settings"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category_id">Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesResult?.data?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier">Tier *</Label>
              <Select
                value={formData.tier}
                onValueChange={(value: 'free' | 'pro') =>
                  setFormData({ ...formData, tier: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_published: checked })
                }
              />
              <Label htmlFor="is_published">Published</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_featured: checked })
                }
              />
              <Label htmlFor="is_featured">Featured</Label>
            </div>
          </div>
        </FormCard>

        <FormCard
          title="Images"
          description="Add images to illustrate the prompt (paths in content-bucket)"
        >
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                id="images"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addImage()
                  }
                }}
                placeholder="images/example.png"
              />
              <Button type="button" onClick={addImage} variant="outline">
                <Plus className="size-4" />
              </Button>
            </div>
            {formData.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.images.map((image) => {
                  const imageUrl = getImageUrl(image)
                  return (
                    <Badge
                      key={image}
                      variant="secondary"
                      className="max-w-xs truncate"
                    >
                      {image}
                      <button
                        type="button"
                        onClick={() => removeImage(image)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>
        </FormCard>

        <FormCard
          title="Relationships"
          description="Associate tags and compatible models with this prompt"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="rounded-md border p-4 space-y-2 max-h-48 overflow-y-auto">
                {tagsResult?.data?.map((tag: any) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={selectedTags.includes(tag.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTags([...selectedTags, tag.id])
                        } else {
                          setSelectedTags(
                            selectedTags.filter((id) => id !== tag.id),
                          )
                        }
                      }}
                    />
                    <Label
                      htmlFor={`tag-${tag.id}`}
                      className="font-normal cursor-pointer"
                    >
                      {tag.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Compatible Models</Label>
              <div className="rounded-md border p-4 space-y-2 max-h-48 overflow-y-auto">
                {modelsResult?.data?.map((model: any) => (
                  <div key={model.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`model-${model.id}`}
                      checked={selectedModels.includes(model.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedModels([...selectedModels, model.id])
                        } else {
                          setSelectedModels(
                            selectedModels.filter((id) => id !== model.id),
                          )
                        }
                      }}
                    />
                    <Label
                      htmlFor={`model-${model.id}`}
                      className="font-normal cursor-pointer"
                    >
                      {model.name}{' '}
                      <span className="text-muted-foreground">
                        ({model.provider_id})
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FormCard>

        <div className="flex items-center gap-2">
          <Button type="submit">Create Prompt</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => list('prompts')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </FormPageLayout>
  )
}

export function PromptsEdit() {
  const { id } = useParams()
  const { result, query } = useOne({ resource: 'prompts', id: id || '' })
  const { data, isLoading } = query
  const { mutate: update } = useUpdate()
  const { list } = useNavigation()
  const { result: categoriesResult } = useList({ resource: 'categories' })
  const { result: tagsResult } = useList({ resource: 'tags' })
  const { result: modelsResult } = useList({ resource: 'ai_models' })

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category_id: '',
    tier: 'free' as 'free' | 'pro',
    is_published: false,
    is_featured: false,
    images: [] as string[],
  })
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [imageInput, setImageInput] = useState('')

  useEffect(() => {
    const loadData = async () => {
      if (result?.data && id) {
        setFormData({
          title: result.data.title || '',
          description: result.data.description || '',
          content: result.data.content || '',
          category_id: result.data.category_id || '',
          tier: result.data.tier || 'free',
          is_published: result.data.is_published ?? false,
          is_featured: result.data.is_featured ?? false,
          images: result.data.images || [],
        })

        // Load existing tags
        const { data: tagsData } = await supabase
          .from('prompt_tags')
          .select('tag_id')
          .eq('prompt_id', id)

        if (tagsData) {
          setSelectedTags(tagsData.map((t: any) => t.tag_id))
        }

        // Load existing models
        const { data: modelsDataResult } = await supabase
          .from('prompt_models')
          .select('model_id')
          .eq('prompt_id', id)

        if (modelsDataResult) {
          setSelectedModels(modelsDataResult.map((m: any) => m.model_id))
        }
      }
    }

    loadData()
  }, [result, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Update prompt
    await supabase
      .from('prompts')
      .update(formData)
      .eq('id', id || '')

    // Update tags: delete old ones and insert new ones
    await supabase
      .from('prompt_tags')
      .delete()
      .eq('prompt_id', id || '')
    if (selectedTags.length > 0) {
      const tagRelations = selectedTags.map((tagId) => ({
        prompt_id: id || '',
        tag_id: tagId,
      }))
      await supabase.from('prompt_tags').insert(tagRelations)
    }

    // Update models: delete old ones and insert new ones
    await supabase
      .from('prompt_models')
      .delete()
      .eq('prompt_id', id || '')
    if (selectedModels.length > 0) {
      const modelRelations = selectedModels.map((modelId) => ({
        prompt_id: id || '',
        model_id: modelId,
      }))
      await supabase.from('prompt_models').insert(modelRelations)
    }

    list('prompts')
  }

  const addImage = () => {
    if (imageInput.trim() && !formData.images.includes(imageInput.trim())) {
      setFormData({
        ...formData,
        images: [...formData.images, imageInput.trim()],
      })
      setImageInput('')
    }
  }

  const removeImage = (image: string) => {
    setFormData({
      ...formData,
      images: formData.images.filter((img) => img !== image),
    })
  }

  return (
    <FormPageLayout
      title="Edit Prompt"
      description="Update prompt information"
      isLoading={isLoading}
    >
      {!isLoading && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormCard
            title="Prompt Details"
            description="Update the information for this prompt"
          >
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Write a compelling product description"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of what this prompt does"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Prompt Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Enter the full prompt content here..."
                  rows={8}
                  required
                />
              </div>
            </div>
          </FormCard>

          <FormCard
            title="Content Settings"
            description="Configure category, tier, and publishing settings"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category_id">Category *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesResult?.data?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tier">Tier *</Label>
                <Select
                  value={formData.tier}
                  onValueChange={(value: 'free' | 'pro') =>
                    setFormData({ ...formData, tier: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-4 pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_published: checked })
                  }
                />
                <Label htmlFor="is_published">Published</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_featured: checked })
                  }
                />
                <Label htmlFor="is_featured">Featured</Label>
              </div>
            </div>
          </FormCard>

          <FormCard
            title="Images"
            description="Update images to illustrate the prompt (paths in content-bucket)"
          >
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="images"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addImage()
                    }
                  }}
                  placeholder="images/example.png"
                />
                <Button type="button" onClick={addImage} variant="outline">
                  <Plus className="size-4" />
                </Button>
              </div>
              {formData.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.images.map((image) => {
                    const imageUrl = getImageUrl(image)
                    return (
                      <Badge
                        key={image}
                        variant="secondary"
                        className="max-w-xs truncate"
                      >
                        {image}
                        <button
                          type="button"
                          onClick={() => removeImage(image)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          </FormCard>

          <FormCard
            title="Relationships"
            description="Associate tags and compatible models with this prompt"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="rounded-md border p-4 space-y-2 max-h-48 overflow-y-auto">
                  {tagsResult?.data?.map((tag: any) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={selectedTags.includes(tag.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTags([...selectedTags, tag.id])
                          } else {
                            setSelectedTags(
                              selectedTags.filter((tagId) => tagId !== tag.id),
                            )
                          }
                        }}
                      />
                      <Label
                        htmlFor={`tag-${tag.id}`}
                        className="font-normal cursor-pointer"
                      >
                        {tag.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Compatible Models</Label>
                <div className="rounded-md border p-4 space-y-2 max-h-48 overflow-y-auto">
                  {modelsResult?.data?.map((model: any) => (
                    <div key={model.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`model-${model.id}`}
                        checked={selectedModels.includes(model.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedModels([...selectedModels, model.id])
                          } else {
                            setSelectedModels(
                              selectedModels.filter(
                                (modelId) => modelId !== model.id,
                              ),
                            )
                          }
                        }}
                      />
                      <Label
                        htmlFor={`model-${model.id}`}
                        className="font-normal cursor-pointer"
                      >
                        {model.name}{' '}
                        <span className="text-muted-foreground">
                          ({model.provider_id})
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FormCard>

          <div className="flex items-center gap-2">
            <Button type="submit">Update Prompt</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => list('prompts')}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </FormPageLayout>
  )
}

export function PromptsShow() {
  const { id } = useParams()
  const { result, query } = useOne({ resource: 'prompts', id: id || '' })
  const { data, isLoading } = query
  const { list, edit } = useNavigation()
  const [tags, setTags] = useState<any[]>([])
  const [models, setModels] = useState<any[]>([])

  useEffect(() => {
    const loadRelations = async () => {
      if (id) {
        // Load tags
        const { data: promptTags } = await supabase
          .from('prompt_tags')
          .select('tags(*)')
          .eq('prompt_id', id)

        if (promptTags) {
          setTags(promptTags.map((pt: any) => pt.tags))
        }

        // Load models
        const { data: promptModels } = await supabase
          .from('prompt_models')
          .select('ai_models(*)')
          .eq('prompt_id', id)

        if (promptModels) {
          setModels(promptModels.map((pm: any) => pm.ai_models))
        }
      }
    }

    loadRelations()
  }, [id])

  const prompt = result?.data

  return (
    <FormPageLayout
      title={prompt?.title || 'Prompt Details'}
      description="View prompt details"
      isLoading={isLoading}
    >
      {!isLoading && prompt && (
        <div className="space-y-6">
          <FormCard
            title="Prompt Content"
            description={prompt?.description || ''}
          >
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Content</Label>
                <div className="mt-2 whitespace-pre-wrap rounded-md border p-4 bg-muted/30 text-sm">
                  {prompt?.content}
                </div>
              </div>

              {prompt?.images && prompt.images.length > 0 && (
                <div>
                  <Label className="text-base font-medium">Images</Label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {prompt.images.map((image: string, index: number) => {
                      const imageUrl = getImageUrl(image)
                      return (
                        <img
                          key={index}
                          src={imageUrl || ''}
                          alt={`Prompt image ${index + 1}`}
                          className="h-24 w-24 rounded-md border object-cover"
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </FormCard>

          <FormCard
            title="Status & Classification"
            description="Current publication and tier status"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={prompt?.is_published ? 'default' : 'outline'}>
                  {prompt?.is_published ? 'Published' : 'Draft'}
                </Badge>
                {prompt?.is_featured && <Badge>Featured</Badge>}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Tier:</span>
                <Badge
                  variant={prompt?.tier === 'pro' ? 'default' : 'secondary'}
                >
                  {prompt?.tier}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Views:</span>
                <span className="text-sm font-medium">
                  {prompt?.views_count || 0}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Category:</span>
                <span className="text-sm">{prompt?.category_id || '—'}</span>
              </div>
            </div>
          </FormCard>

          {tags.length > 0 && (
            <FormCard
              title="Tags"
              description="Associated tags for organization"
            >
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: any) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </FormCard>
          )}

          {models.length > 0 && (
            <FormCard
              title="Compatible Models"
              description="AI models that work with this prompt"
            >
              <div className="space-y-2">
                {models.map((model: any) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <span className="text-sm font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.provider_id}
                    </span>
                  </div>
                ))}
              </div>
            </FormCard>
          )}

          <div className="flex items-center gap-2 pt-4">
            <Button onClick={() => edit('prompts', id || '')}>
              <Pencil className="mr-2 size-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => list('prompts')}>
              Back to List
            </Button>
          </div>
        </div>
      )}
    </FormPageLayout>
  )
}
