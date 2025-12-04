import { useState } from 'react'
import { useNavigation, useList } from '@refinedev/core'
import { Plus, X } from 'lucide-react'

import {
  CreateView,
  CreateViewHeader,
} from '@/components/refine-ui/views/create-view'
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/libs/supabase'

export function PromptsCreate() {
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleTitleChange = (title: string) => {
    if (autoSlug) {
      setFormData({ ...formData, title, id: generateSlug(title) })
    } else {
      setFormData({ ...formData, title })
    }
  }

  const handleIdChange = (id: string) => {
    setFormData({ ...formData, id })
    setAutoSlug(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create prompt first
      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .insert(formData)
        .select()
        .single()

      if (promptError) {
        console.error('Error creating prompt:', promptError)
        setIsSubmitting(false)
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
    } catch (error) {
      console.error('Error:', error)
      setIsSubmitting(false)
    }
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
    <CreateView>
      <CreateViewHeader title="Create Prompt" />
      <LoadingOverlay loading={isSubmitting}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Details</CardTitle>
              <CardDescription>
                Enter the information for the new prompt
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Settings</CardTitle>
              <CardDescription>
                Configure category, tier, and publishing settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Add images to illustrate the prompt (paths in content-bucket)
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                    {formData.images.map((image) => (
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
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relationships</CardTitle>
              <CardDescription>
                Associate tags and compatible models with this prompt
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                      <div
                        key={model.id}
                        className="flex items-center space-x-2"
                      >
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
            </CardContent>
          </Card>

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isSubmitting}>
              Create Prompt
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => list('prompts')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </LoadingOverlay>
    </CreateView>
  )
}
