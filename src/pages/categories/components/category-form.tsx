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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'
import { Tables } from '@/types/database.types'
import { FormAction, HttpError, useBack } from '@refinedev/core'
import { useForm } from '@refinedev/react-hook-form'
import { getDefaultsForSchema } from 'zod-defaults'
import { zodResolver } from '@hookform/resolvers/zod'
import { slug } from '@/utils/validations'
import { SlugField } from '@/components/forms/slug-field'

type Category = Tables<'categories'>

export const categoryFormSchema = z.object({
  id: slug,
  name: z.string().min(1, 'Category name is required'),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

interface CategoryFormProps {
  mode: Exclude<FormAction, 'clone'>
}

export function CategoryForm({ mode }: CategoryFormProps) {
  const isCreate = mode === 'create'
  const back = useBack()

  const {
    refineCore: { onFinish, formLoading, mutation },
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

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onFinish)}
        className="space-y-6 max-w-2xl"
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
