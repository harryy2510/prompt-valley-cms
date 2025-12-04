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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  const [imageInput, setImageInput] = useState('')
  const [isLoadingRelations, setIsLoadingRelations] = useState(true)
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

  // Load existing junction table relations
  useEffect(() => {
    const loadRelations = async () => {
      if (id && query?.data) {
        setIsLoadingRelations(true)

        // Load existing tags
        const { data: tagsData } = await supabase
          .from('prompt_tags')
          .select('tag_id')
          .eq('prompt_id', id)

        if (tagsData) {
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

        if (modelsData) {
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

  const addImage = () => {
    if (imageInput.trim()) {
      const current = form.getValues('images')
      if (!current.includes(imageInput.trim())) {
        form.setValue('images', [...current, imageInput.trim()])
        setImageInput('')
      }
    }
  }

  const removeImage = (image: string) => {
    const current = form.getValues('images')
    form.setValue(
      'images',
      current.filter((img: string) => img !== image),
    )
  }

  const isLoading = query?.isLoading || isLoadingRelations

  return (
    <EditView>
      <EditViewHeader title="Edit Prompt" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFinish)} className="space-y-6">
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
                  Update images to illustrate the prompt (paths in
                  content-bucket)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
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
                  {form.watch('images')?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.watch('images').map((image: string) => (
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
