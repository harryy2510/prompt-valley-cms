import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { useForm } from '@refinedev/react-hook-form'
import { useSelect, useNavigation } from '@refinedev/core'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, X } from 'lucide-react'

import {
  EditView,
  EditViewHeader,
} from '@/components/refine-ui/views/edit-view'
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/libs/supabase'
import { getImageUrl } from '@/libs/storage'
import { Input } from '@/components/ui/input'

const promptSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  category_id: z.string().min(1, 'Category is required'),
  tier: z.enum(['free', 'pro']).default('free'),
  is_published: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  models: z.array(z.string()).default([]),
})

type PromptFormData = z.infer<typeof promptSchema>

export function PromptsEdit() {
  const { id } = useParams()
  const [isLoadingRelations, setIsLoadingRelations] = useState(true)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const { list } = useNavigation()

  const { options: categoryOptions } = useSelect({
    resource: 'categories',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 1000 },
  })

  const { options: tagOptions } = useSelect({
    resource: 'tags',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 1000 },
  })

  const { options: modelOptions } = useSelect({
    resource: 'ai_models',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 1000 },
  })

  const {
    refineCore: { onFinish, formLoading, query },
    ...form
  } = useForm<PromptFormData>({
    resolver: zodResolver(promptSchema) as any,
    refineCoreProps: {
      resource: 'prompts',
      action: 'edit',
      id: id || '',
      redirect: 'list',
      meta: {
        select: '*, categories(id, name)',
      },
      onMutationSuccess: async (data) => {
        // Handle junction table updates after main record is updated
        const promptId = id || ''
        const tags = form.getValues('tags')
        const models = form.getValues('models')

        // Update tags: delete old ones and insert new ones
        await supabase.from('prompt_tags').delete().eq('prompt_id', promptId)
        if (tags.length > 0) {
          const tagRelations = tags.map((tagId: string) => ({
            prompt_id: promptId,
            tag_id: tagId,
          }))
          await supabase.from('prompt_tags').insert(tagRelations)
        }

        // Update models: delete old ones and insert new ones
        await supabase.from('prompt_models').delete().eq('prompt_id', promptId)
        if (models.length > 0) {
          const modelRelations = models.map((modelId: string) => ({
            prompt_id: promptId,
            model_id: modelId,
          }))
          await supabase.from('prompt_models').insert(modelRelations)
        }
      },
    },
  })

  // Load existing junction table relations and images
  useEffect(() => {
    const loadRelations = async () => {
      if (id && query?.data?.data) {
        setIsLoadingRelations(true)

        const data = query.data.data

        // Initialize all form fields from query data
        form.setValue('id', data.id || '')
        form.setValue('title', data.title || '')
        form.setValue('description', data.description || '')
        form.setValue('content', data.content || '')
        form.setValue('category_id', data.category_id || '')
        form.setValue('tier', data.tier || 'free')
        form.setValue('is_published', data.is_published || false)
        form.setValue('is_featured', data.is_featured || false)
        form.setValue('images', data.images || [])
        form.setValue('tags', [])
        form.setValue('models', [])

        // Load existing tags
        const { data: tagsData } = await supabase
          .from('prompt_tags')
          .select('tag_id')
          .eq('prompt_id', id)

        if (tagsData && tagsData.length > 0) {
          form.setValue(
            'tags',
            tagsData.map((t: any) => t.tag_id),
          )
        }

        // Load existing models
        const { data: modelsData } = await supabase
          .from('prompt_models')
          .select('model_id')
          .eq('prompt_id', id)

        if (modelsData && modelsData.length > 0) {
          form.setValue(
            'models',
            modelsData.map((m: any) => m.model_id),
          )
        }

        setIsLoadingRelations(false)
      }
    }

    loadRelations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, query?.data])

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true)
    const { uploadImage } = await import('@/libs/storage')
    const filePath = await uploadImage(file, 'images/prompts')
    setIsUploadingImage(false)

    if (filePath) {
      const current = form.getValues('images') || []
      form.setValue('images', [...current, filePath])
    }
  }

  const removeImage = async (image: string) => {
    const current = form.getValues('images')
    form.setValue(
      'images',
      current.filter((img: string) => img !== image),
    )
  }

  const isLoading = query?.isLoading || isLoadingRelations

  const handleSubmit = (data: PromptFormData) => {
    // Remove junction table fields before submitting
    const { tags, models, ...promptData } = data
    return onFinish(promptData as any)
  }

  return (
    <EditView>
      <EditViewHeader title="Edit Prompt" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <LoadingOverlay loading={isLoading || formLoading}>
            <Card>
              <CardHeader>
                <CardTitle>Prompt Details</CardTitle>
                <CardDescription>
                  Update the information for this prompt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Write a compelling product description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of what this prompt does"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt Content *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the full prompt content here..."
                          rows={8}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoryOptions?.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={String(option.value)}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tier *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-4 pt-2 border-t">
                  <FormField
                    control={form.control}
                    name="is_published"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Published</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_featured"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Featured</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>
                  Add images to illustrate the prompt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="prompt-image-upload">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isUploadingImage}
                        onClick={() =>
                          document
                            .getElementById('prompt-image-upload')
                            ?.click()
                        }
                      >
                        {isUploadingImage ? (
                          <>Uploading...</>
                        ) : (
                          <>
                            <Plus className="mr-2 size-4" />
                            Add Image
                          </>
                        )}
                      </Button>
                    </label>
                    <input
                      id="prompt-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file)
                        e.target.value = ''
                      }}
                      disabled={isUploadingImage}
                      className="hidden"
                    />
                  </div>

                  {form.watch('images')?.length > 0 && (
                    <div className="space-y-2">
                      {form.watch('images').map((image: string) => {
                        const imageUrl = getImageUrl(image)
                        return (
                          <div
                            key={image}
                            className="flex items-center gap-3 rounded-md border p-3"
                          >
                            {imageUrl && (
                              <img
                                src={imageUrl}
                                alt="Prompt image"
                                className="size-16 rounded border object-cover"
                              />
                            )}
                            <div className="flex-1 space-y-1">
                              <p className="text-xs text-muted-foreground break-all">
                                {image}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeImage(image)}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        )
                      })}
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
                  <FormField
                    control={form.control}
                    name="tags"
                    render={() => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <div className="rounded-md border p-4 space-y-2 max-h-48 overflow-y-auto">
                          {tagOptions?.map((tag) => (
                            <FormField
                              key={tag.value}
                              control={form.control}
                              name="tags"
                              render={({ field }) => (
                                <FormItem
                                  key={tag.value}
                                  className="flex items-center space-x-2"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(
                                        String(tag.value),
                                      )}
                                      onCheckedChange={(checked) => {
                                        const value = String(tag.value)
                                        return checked
                                          ? field.onChange([
                                              ...field.value,
                                              value,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (v: string) => v !== value,
                                              ),
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer !mt-0">
                                    {tag.label}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="models"
                    render={() => (
                      <FormItem>
                        <FormLabel>Compatible Models</FormLabel>
                        <div className="rounded-md border p-4 space-y-2 max-h-48 overflow-y-auto">
                          {modelOptions?.map((model) => (
                            <FormField
                              key={model.value}
                              control={form.control}
                              name="models"
                              render={({ field }) => (
                                <FormItem
                                  key={model.value}
                                  className="flex items-center space-x-2"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(
                                        String(model.value),
                                      )}
                                      onCheckedChange={(checked) => {
                                        const value = String(model.value)
                                        return checked
                                          ? field.onChange([
                                              ...field.value,
                                              value,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (v: string) => v !== value,
                                              ),
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer !mt-0">
                                    {model.label}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

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
          </LoadingOverlay>
        </form>
      </Form>
    </EditView>
  )
}
