import { useParams } from 'react-router'
import { useForm } from '@refinedev/react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { EditView, EditViewHeader } from '@/components/refine-ui/views/edit-view'
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

const categorySchema = z.object({
  id: z.string().min(1, 'Category ID is required'),
  name: z.string().min(1, 'Category name is required'),
})

type CategoryFormData = z.infer<typeof categorySchema>

export function CategoriesEdit() {
  const { id } = useParams()

  const {
    refineCore: { onFinish, formLoading, query },
    ...form
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema) as any,
    refineCoreProps: {
      resource: 'categories',
      action: 'edit',
      id: id || '',
      redirect: 'list',
    },
  })

  return (
    <EditView>
      <EditViewHeader title="Edit Category" />

      <LoadingOverlay loading={query?.isLoading || formLoading}>
        {!query?.isLoading && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onFinish)} className="space-y-6 max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle>Category Information</CardTitle>
                  <CardDescription>
                    Update the category information
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
                          <Input placeholder="e.g. Marketing, Development" {...field} />
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
                        <FormLabel>Category ID *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. marketing, development"
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
            </form>
          </Form>
        )}
      </LoadingOverlay>
    </EditView>
  )
}
