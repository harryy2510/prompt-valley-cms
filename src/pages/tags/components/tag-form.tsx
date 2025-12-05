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
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes-warning'

type Tag = Tables<'tags'>

export const tagFormSchema = z.object({
  id: slug,
  name: z.string().min(1, 'Tag name is required'),
})

export type TagFormValues = z.infer<typeof tagFormSchema>

interface TagFormProps {
  mode: Exclude<FormAction, 'clone'>
}

export function TagForm({ mode }: TagFormProps) {
  const isCreate = mode === 'create'
  const back = useBack()

  const {
    refineCore: { onFinish, formLoading, mutation },
    ...form
  } = useForm<Tag, HttpError, TagFormValues>({
    defaultValues: getDefaultsForSchema(tagFormSchema),
    resolver: zodResolver(tagFormSchema),
    refineCoreProps: {
      resource: 'tags',
      action: mode,
      redirect: 'list',
    },
  })

  useUnsavedChangesWarning({
    isDirty: form.formState.isDirty,
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
              <CardTitle>Tag Information</CardTitle>
              <CardDescription>
                {isCreate
                  ? 'Enter the information for the tag'
                  : 'Update the tag information'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Content Writing, SEO"
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
                resource="tags"
                label="Tag ID *"
                description={
                  isCreate
                    ? 'Unique identifier for the tag'
                    : 'The ID cannot be changed after creation'
                }
                placeholder="e.g. content-writing, seo"
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
                  ? 'Create Tag'
                  : 'Save'}
            </Button>
          </div>
        </LoadingOverlay>
      </form>
    </Form>
  )
}
