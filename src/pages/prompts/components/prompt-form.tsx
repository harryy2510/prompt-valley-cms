import { useState, useEffect } from 'react'
import * as z from 'zod'
import { Plus, X } from 'lucide-react'
import { startCase } from 'lodash-es'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from '@/components/ui/multi-select'
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'
import { Enums, Tables } from '@/types/database.types'
import { FormAction, HttpError, useBack, useSelect } from '@refinedev/core'
import { useForm } from '@refinedev/react-hook-form'
import { getDefaultsForSchema } from 'zod-defaults'
import { zodResolver } from '@hookform/resolvers/zod'
import { slug } from '@/utils/validations'
import { SlugField } from '@/components/forms/slug-field'
import { supabase } from '@/libs/supabase'
import { getImageUrl, uploadImage } from '@/libs/storage'

type Prompt = Tables<'prompts'>
type Category = Tables<'categories'>
type Tag = Tables<'tags'>
type AIModel = Tables<'ai_models'>
type Tier = Enums<'tier'>

const TIER_OPTIONS: Tier[] = ['free', 'pro']

export const promptFormSchema = z.object({
  id: slug,
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  content: z.string().min(1, 'Content is required'),
  category_id: z.string().min(1, 'Category is required'),
  tier: z.enum(TIER_OPTIONS),
  is_published: z.boolean(),
  is_featured: z.boolean(),
  images: z.array(z.string()),
  // Junction table fields (not in prompts table)
  tags: z.array(z.string()),
  models: z.array(z.string()),
})

export type PromptFormValues = z.infer<typeof promptFormSchema>

interface PromptFormProps {
  mode: Exclude<FormAction, 'clone'>
}

export function PromptForm({ mode }: PromptFormProps) {
  const isCreate = mode === 'create'
  const back = useBack()
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isLoadingRelations, setIsLoadingRelations] = useState(!isCreate)

  const {
    refineCore: { onFinish, formLoading, mutation, query, id },
    ...form
  } = useForm<Prompt, HttpError, PromptFormValues>({
    defaultValues: getDefaultsForSchema(promptFormSchema),
    resolver: zodResolver(promptFormSchema),
    refineCoreProps: {
      resource: 'prompts',
      action: mode,
      redirect: 'list',
    },
  })

  const { options: categoryOptions } = useSelect<Category>({
    resource: 'categories',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 1000 },
  })

  const { options: tagOptions } = useSelect<Tag>({
    resource: 'tags',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 1000 },
  })

  const { options: modelOptions } = useSelect<AIModel>({
    resource: 'ai_models',
    optionLabel: 'name',
    optionValue: 'id',
    pagination: { pageSize: 1000 },
  })

  // Load junction table relations for edit mode
  useEffect(() => {
    const loadRelations = async () => {
      if (!isCreate && id && query?.data?.data) {
        setIsLoadingRelations(true)

        // Load existing tags
        const { data: tagsData } = await supabase
          .from('prompt_tags')
          .select('tag_id')
          .eq('prompt_id', id)

        if (tagsData && tagsData.length > 0) {
          form.setValue(
            'tags',
            tagsData.map((t) => t.tag_id),
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
            modelsData.map((m) => m.model_id),
          )
        }

        setIsLoadingRelations(false)
      }
    }

    loadRelations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, query?.data?.data, isCreate])

  const handleSubmit = async (data: PromptFormValues) => {
    const { tags, models, ...promptData } = data

    // Submit the main prompt data
    await onFinish(promptData as any)

    // Handle junction tables after main record is saved
    const promptId = data.id

    if (isCreate) {
      // Insert new relations
      if (tags.length > 0) {
        await supabase.from('prompt_tags').insert(
          tags.map((tagId) => ({
            prompt_id: promptId,
            tag_id: tagId,
          })),
        )
      }
      if (models.length > 0) {
        await supabase.from('prompt_models').insert(
          models.map((modelId) => ({
            prompt_id: promptId,
            model_id: modelId,
          })),
        )
      }
    } else {
      // Update: delete old and insert new
      await supabase.from('prompt_tags').delete().eq('prompt_id', promptId)
      if (tags.length > 0) {
        await supabase.from('prompt_tags').insert(
          tags.map((tagId) => ({
            prompt_id: promptId,
            tag_id: tagId,
          })),
        )
      }

      await supabase.from('prompt_models').delete().eq('prompt_id', promptId)
      if (models.length > 0) {
        await supabase.from('prompt_models').insert(
          models.map((modelId) => ({
            prompt_id: promptId,
            model_id: modelId,
          })),
        )
      }
    }
  }

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true)
    const filePath = await uploadImage(file, 'images/prompts')
    setIsUploadingImage(false)

    if (filePath) {
      const current = form.getValues('images') || []
      form.setValue('images', [...current, filePath])
    }
  }

  const removeImage = (image: string) => {
    const current = form.getValues('images') || []
    form.setValue(
      'images',
      current.filter((img) => img !== image),
    )
  }

  const isLoading = formLoading || isLoadingRelations

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 w-full max-w-4xl mx-auto"
      >
        <LoadingOverlay containerClassName="space-y-6" loading={isLoading}>
          <Card>
            <CardHeader>
              <CardTitle>Prompt Details</CardTitle>
              <CardDescription>
                {isCreate
                  ? 'Enter the information for the new prompt'
                  : 'Update the prompt information'}
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

              <SlugField
                name="id"
                sourceValue={form.watch('title')}
                resource="prompts"
                label="Prompt ID *"
                description={
                  isCreate
                    ? 'Unique identifier for the prompt'
                    : 'The ID cannot be changed after creation'
                }
                placeholder="e.g. write-product-description"
                disabled={!isCreate}
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
                        value={field.value ?? ''}
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
                          {TIER_OPTIONS.map((tier) => (
                            <SelectItem key={tier} value={tier}>
                              {startCase(tier)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-6 pt-2 border-t">
                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
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
                    <FormItem className="flex items-center gap-2">
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
              <CardTitle>Relationships</CardTitle>
              <CardDescription>
                Associate tags and compatible models with this prompt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <MultiSelect
                      values={field.value}
                      onValuesChange={field.onChange}
                    >
                      <MultiSelectTrigger className="w-full">
                        <MultiSelectValue placeholder="Select tags..." />
                      </MultiSelectTrigger>
                      <MultiSelectContent>
                        <MultiSelectGroup>
                          {tagOptions?.map((tag) => (
                            <MultiSelectItem
                              key={tag.value}
                              value={String(tag.value)}
                            >
                              {tag.label}
                            </MultiSelectItem>
                          ))}
                        </MultiSelectGroup>
                      </MultiSelectContent>
                    </MultiSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="models"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compatible Models</FormLabel>
                    <MultiSelect
                      values={field.value}
                      onValuesChange={field.onChange}
                    >
                      <MultiSelectTrigger className="w-full">
                        <MultiSelectValue placeholder="Select compatible models..." />
                      </MultiSelectTrigger>
                      <MultiSelectContent>
                        <MultiSelectGroup>
                          {modelOptions?.map((model) => (
                            <MultiSelectItem
                              key={model.value}
                              value={String(model.value)}
                            >
                              {model.label}
                            </MultiSelectItem>
                          ))}
                        </MultiSelectGroup>
                      </MultiSelectContent>
                    </MultiSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploadingImage}
                    onClick={() =>
                      document.getElementById('prompt-image-upload')?.click()
                    }
                  >
                    {isUploadingImage ? (
                      'Uploading...'
                    ) : (
                      <>
                        <Plus className="mr-2 size-4" />
                        Add Image
                      </>
                    )}
                  </Button>
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

                {(form.watch('images') || []).length > 0 && (
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
                          <div className="flex-1">
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

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={back}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? isCreate
                  ? 'Creating...'
                  : 'Saving...'
                : isCreate
                  ? 'Create Prompt'
                  : 'Save'}
            </Button>
          </div>
        </LoadingOverlay>
      </form>
    </Form>
  )
}
