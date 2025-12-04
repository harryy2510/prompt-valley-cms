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
import { getImageUrl } from '@/libs/storage'

const providerSchema = z.object({
  id: z.string().min(1, 'Provider ID is required'),
  name: z.string().min(1, 'Provider name is required'),
  logo_url: z.string().optional(),
  website_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type ProviderFormData = z.infer<typeof providerSchema>

export function AiProvidersCreate() {
  const [autoSlug, setAutoSlug] = useState(true)

  const {
    refineCore: { onFinish, formLoading },
    ...form
  } = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema) as any,
    defaultValues: {
      id: '',
      name: '',
      logo_url: '',
      website_url: '',
    },
    refineCoreProps: {
      resource: 'ai_providers',
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

  const previewUrl = getImageUrl(form.watch('logo_url'))

  return (
    <CreateView>
      <CreateViewHeader title="Create AI Provider" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFinish)} className="space-y-6 max-w-2xl">
          <LoadingOverlay loading={formLoading}>
            <Card>
              <CardHeader>
                <CardTitle>Provider Information</CardTitle>
                <CardDescription>
                  Enter the basic information for the AI provider
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. OpenAI, Anthropic, Google"
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
                        Provider ID *
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (auto-generated)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. openai, anthropic"
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

            <Card>
              <CardHeader>
                <CardTitle>Branding & Links</CardTitle>
                <CardDescription>
                  Optional logo and website information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo Path (in content-bucket)</FormLabel>
                      <FormControl>
                        <Input placeholder="logos/openai.png" {...field} />
                      </FormControl>
                      <FormMessage />
                      {previewUrl && (
                        <div className="flex items-center gap-3 rounded-md border p-3">
                          <img
                            src={previewUrl}
                            alt="Logo preview"
                            className="size-12 rounded border object-contain p-1"
                          />
                          <p className="text-xs text-muted-foreground">Logo preview</p>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={formLoading}>
                Create Provider
              </Button>
            </div>
          </LoadingOverlay>
        </form>
      </Form>
    </CreateView>
  )
}
