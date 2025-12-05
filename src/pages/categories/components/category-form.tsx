import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  FormDescription,
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
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'
import { Tables } from '@/types/database.types'
import { FormAction, HttpError, useBack, useSelect } from '@refinedev/core'
import { useForm } from '@refinedev/react-hook-form'
import { getDefaultsForSchema } from 'zod-defaults'
import { zodResolver } from '@hookform/resolvers/zod'
import { slug } from '@/utils/validations'
import { SlugField } from '@/components/forms/slug-field'

type Category = Tables<'categories'>

export const categoryFormSchema = z.object({
  id: slug,
  name: z.string().min(1, 'Category name is required'),
  parent_id: z.string().nullable().optional(),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

interface CategoryFormProps {
  mode: Exclude<FormAction, 'clone'>
}

export function CategoryForm({ mode }: CategoryFormProps) {
  const isCreate = mode === 'create'
  const back = useBack()

  const {
    refineCore: { onFinish, formLoading, mutation, query },
    ...form
  } = useForm<Category, HttpError, CategoryFormValues>({
    defaultValues: getDefaultsForSchema(categoryFormSchema),
    resolver: zodResolver(categoryFormSchema),
    refineCoreProps: {
      resource: 'categories',
      action: mode,
      redirect: 'list',
    },
  })

  const currentCategoryId = query?.data?.data?.id

  // Fetch parent categories (only top-level categories can be parents)
  const { options: parentOptions } = useSelect<Category>({
    resource: 'categories',
    optionLabel: 'name',
    optionValue: 'id',
    filters: [
      {
        field: 'parent_id',
        operator: 'null',
        value: true,
      },
      // Exclude current category when editing
      ...(currentCategoryId
        ? [
            {
              field: 'id',
              operator: 'ne' as const,
              value: currentCategoryId,
            },
          ]
        : []),
    ],
    pagination: { pageSize: 1000 },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onFinish)}
        className="space-y-6 w-full max-w-4xl mx-auto"
      >
        <LoadingOverlay containerClassName="space-y-6" loading={formLoading}>
          <Card>
            <CardHeader>
              <CardTitle>Category Information</CardTitle>
              <CardDescription>
                {isCreate
                  ? 'Enter the information for the category'
                  : 'Update the category information'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Marketing, Development"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SlugField
                name="id"
                sourceValue={form.watch('name')}
                resource="categories"
                label="Category ID *"
                description={
                  isCreate
                    ? 'Unique identifier for the category'
                    : 'The ID cannot be changed after creation'
                }
                placeholder="e.g. marketing, development"
                disabled={!isCreate}
              />

              <FormField
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Category</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === '_none_' ? null : value)
                      }
                      value={field.value ?? '_none_'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full max-w-[400px]">
                          <SelectValue placeholder="Select a parent category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none_">
                          <span className="text-muted-foreground">
                            No parent (top-level)
                          </span>
                        </SelectItem>
                        {parentOptions?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Optionally nest this category under a parent. Only one
                      level of nesting is allowed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  ? 'Create Category'
                  : 'Save'}
            </Button>
          </div>
        </LoadingOverlay>
      </form>
    </Form>
  )
}
