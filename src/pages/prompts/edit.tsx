import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { useNavigation, useOne, useList } from '@refinedev/core'
import { Plus, X } from 'lucide-react'

import {
  EditView,
  EditViewHeader,
} from '@/components/refine-ui/views/edit-view'
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

export function PromptsEdit() {
  const { id } = useParams()
  const { result, query } = useOne({
    resource: 'prompts',
    id: id || '',
    meta: {
      select: '*, categories(id, name)',
    },
  })
  const { isLoading } = query
  const { list } = useNavigation()
  const { result: categoriesResult } = useList({
    resource: 'categories',
    pagination: { pageSize: 1000 },
  })
  const { result: tagsResult } = useList({
    resource: 'tags',
    pagination: { pageSize: 1000 },
  })
  const { result: modelsResult } = useList({
    resource: 'ai_models',
    pagination: { pageSize: 1000 },
  })

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
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (result && id) {
        setFormData({
          title: result.title || '',
          description: result.description || '',
          content: result.content || '',
          category_id: result.category_id || '',
          tier: result.tier || 'free',
          is_published: result.is_published ?? false,
          is_featured: result.is_featured ?? false,
          images: result.images || [],
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
    setIsSubmitting(true)

    try {
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
    <EditView>
      <EditViewHeader title="Edit Prompt" />
      <LoadingOverlay loading={isLoading || isSubmitting}>
        {!isLoading && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prompt Details</CardTitle>
                <CardDescription>
                  Update the information for this prompt
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
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
                      value={formData.category_id || undefined}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category_id: value })
                      }
                      required
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
                  Update images to illustrate the prompt (paths in
                  content-bucket)
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
                        <div
                          key={tag.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={selectedTags.includes(tag.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTags([...selectedTags, tag.id])
                              } else {
                                setSelectedTags(
                                  selectedTags.filter(
                                    (tagId) => tagId !== tag.id,
                                  ),
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
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isSubmitting}>
                Update Prompt
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
        )}
      </LoadingOverlay>
    </EditView>
  )
}
