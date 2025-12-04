import { useParams } from 'react-router'
import { useForm } from '@refinedev/react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import {
  EditView,
  EditViewHeader,
} from '@/components/refine-ui/views/edit-view'
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
import { LoadingOverlay } from '@/components/refine-ui/layout/loading-overlay'

const tagSchema = z.object({
  id: z.string().min(1, 'Tag ID is required'),
  name: z.string().min(1, 'Tag name is required'),
})

type TagFormData = z.infer<typeof tagSchema>

export function TagsEdit() {
  const { id } = useParams()

  const {
    refineCore: { onFinish, formLoading, query },
    ...form
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema) as any,
    refineCoreProps: {
      resource: 'tags',
      action: 'edit',
      id: id || '',
      redirect: 'list',
    },
  })

  return (
    <EditView>
      <EditViewHeader title="Edit Tag" />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onFinish)}
          className="space-y-6 max-w-2xl"
        >
          <LoadingOverlay loading={query?.isLoading || formLoading}>
            <Card>
              <CardHeader>
                <CardTitle>Tag Information</CardTitle>
                <CardDescription>Update the tag information</CardDescription>
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

                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tag ID *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. content-writing, seo"
                          className="font-mono text-sm"
                          {...field}
                          disabled
                        />
                      </FormControl>
                      <FormDescription>
                        Unique identifier cannot be changed after creation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={formLoading}>
                Save Changes
              </Button>
            </div>
          </LoadingOverlay>
        </form>
      </Form>
    </EditView>
  )
}
