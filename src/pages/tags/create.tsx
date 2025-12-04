import { useState } from 'react'
import { useForm } from '@refinedev/react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { CreateView, CreateViewHeader } from '@/components/refine-ui/views/create-view'
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

export function TagsCreate() {
  const [autoSlug, setAutoSlug] = useState(true)

  const {
    refineCore: { onFinish, formLoading },
    ...form
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema) as any,
    defaultValues: {
      id: '',
      name: '',
    },
    refineCoreProps: {
      resource: 'tags',
      action: 'create',
      redirect: 'list',
    },
  })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleNameChange = (name: string) => {
    form.setValue('name', name)
    if (autoSlug) {
      form.setValue('id', generateSlug(name))
    }
  }

  return (
    <CreateView>
      <CreateViewHeader title="Create Tag" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFinish)} className="space-y-6 max-w-2xl">
          <LoadingOverlay loading={formLoading}>
            <Card>
              <CardHeader>
                <CardTitle>Tag Information</CardTitle>
                <CardDescription>
                  Enter the information for the tag
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
                          onChange={(e) => handleNameChange(e.target.value)}
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
                      <FormLabel>
                        Tag ID *
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (auto-generated)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. content-writing, seo"
                          className="font-mono text-sm"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            setAutoSlug(false)
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Unique identifier used in the system. Auto-generated from name but can be customized.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={formLoading}>
                Create Tag
              </Button>
            </div>
          </LoadingOverlay>
        </form>
      </Form>
    </CreateView>
  )
}
